import fs from 'fs-extra';
import { join } from 'path';
import webpack from 'webpack';
import terser from 'terser';
import rollupCommonjs from '@rollup/plugin-commonjs';
import rollupResolve from '@rollup/plugin-node-resolve';
import { BuildOptions } from '../utils/options';
import { RollupOptions } from 'rollup';
import { relativePathPlugin } from './plugins/relative-path-plugin';
import { aliasPlugin } from './plugins/alias-plugin';
import { prettyMinifyPlugin } from './plugins/pretty-minify';

export async function sysNode(opts: BuildOptions) {
  const inputFile = join(opts.transpiledDir, 'sys', 'node', 'index.js');
  const outputFile = join(opts.output.sysNodeDir, 'index.js');

  const sysNodeBundle: RollupOptions = {
    input: inputFile,
    output: {
      format: 'cjs',
      file: outputFile,
      preferConst: true,
      freeze: false,
    },
    external: ['child_process', 'crypto', 'events', 'https', 'path', 'readline', 'os', 'util'],
    plugins: [
      relativePathPlugin('glob', './glob.js'),
      relativePathPlugin('graceful-fs', './graceful-fs.js'),
      relativePathPlugin('prompts', './prompts.js'),
      aliasPlugin(opts),
      rollupResolve({
        preferBuiltins: true,
      }),
      rollupCommonjs({
        transformMixedEsModules: false,
      }),
      prettyMinifyPlugin(opts),
    ],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      unknownGlobalSideEffects: false,
    },
  };

  const inputWorkerFile = join(opts.transpiledDir, 'sys', 'node', 'worker.js');
  const outputWorkerFile = join(opts.output.sysNodeDir, 'worker.js');
  const sysNodeWorkerBundle: RollupOptions = {
    input: inputWorkerFile,
    output: {
      format: 'cjs',
      file: outputWorkerFile,
      preferConst: true,
      freeze: false,
    },
    external: ['child_process', 'crypto', 'events', 'https', 'path', 'readline', 'os', 'util'],
    plugins: [
      {
        name: 'sysNodeWorkerAlias',
        resolveId(id) {
          if (id === '@stencil/core/compiler') {
            return {
              id: '../../compiler/stencil.js',
              external: true,
            };
          }
        },
      },
      rollupResolve({
        preferBuiltins: true,
      }),
      aliasPlugin(opts),
      prettyMinifyPlugin(opts),
    ],
  };

  return [sysNodeBundle, sysNodeWorkerBundle];
}

export async function sysNodeExternalBundles(opts: BuildOptions) {
  const cachedDir = join(opts.transpiledDir, 'sys-node-bundle-cache');

  await fs.ensureDir(cachedDir);

  await Promise.all([
    bundleExternal(opts, opts.output.sysNodeDir, cachedDir, 'autoprefixer.js'),
    bundleExternal(opts, opts.output.sysNodeDir, cachedDir, 'glob.js'),
    bundleExternal(opts, opts.output.sysNodeDir, cachedDir, 'graceful-fs.js'),
    bundleExternal(opts, opts.output.sysNodeDir, cachedDir, 'node-fetch.js'),
    bundleExternal(opts, opts.output.sysNodeDir, cachedDir, 'prompts.js'),
    bundleExternal(opts, opts.output.devServerDir, cachedDir, 'open-in-editor-api.js'),
    bundleExternal(opts, opts.output.devServerDir, cachedDir, 'ws.js'),
  ]);

  // open-in-editor's visualstudio.vbs file
  const visualstudioVbsSrc = join(opts.nodeModulesDir, 'open-in-editor', 'lib', 'editors', 'visualstudio.vbs');
  const visualstudioVbsDesc = join(opts.output.devServerDir, 'visualstudio.vbs');
  await fs.copy(visualstudioVbsSrc, visualstudioVbsDesc);

  // copy open's xdg-open file
  const xdgOpenSrcPath = join(opts.nodeModulesDir, 'open', 'xdg-open');
  const xdgOpenDestPath = join(opts.output.devServerDir, 'xdg-open');
  await fs.copy(xdgOpenSrcPath, xdgOpenDestPath);
}

function bundleExternal(opts: BuildOptions, outputDir: string, cachedDir: string, entryFileName: string) {
  return new Promise(async (resolveBundle, rejectBundle) => {
    const outputFile = join(outputDir, entryFileName);
    const cachedFile = join(cachedDir, entryFileName);

    if (!opts.isProd) {
      const cachedExists = fs.existsSync(cachedFile);
      if (cachedExists) {
        await fs.copyFile(cachedFile, outputFile);
        resolveBundle();
        return;
      }
    }

    const whitelist = new Set(['child_process', 'os', 'typescript']);

    webpack(
      {
        entry: join(opts.srcDir, 'sys', 'node', 'bundles', entryFileName),
        output: {
          path: outputDir,
          filename: entryFileName,
          libraryTarget: 'commonjs',
        },
        target: 'node',
        node: {
          __dirname: false,
          __filename: false,
          process: false,
          Buffer: false,
        },
        externals(_context, request, callback) {
          if (request.match(/^(\.{0,2})\//)) {
            // absolute and relative paths are not externals
            return callback(null, undefined);
          }

          if (request === '@stencil/core/mock-doc') {
            return callback(null, '../../mock-doc');
          }

          if (whitelist.has(request)) {
            // we specifically do not want to bundle these imports
            require.resolve(request);
            return callback(null, request);
          }

          // bundle this import
          callback(undefined, undefined);
        },
        resolve: {
          alias: {
            '@utils': join(opts.transpiledDir, 'utils', 'index.js'),
            'postcss': join(opts.nodeModulesDir, 'postcss'),
            'source-map': join(opts.nodeModulesDir, 'source-map'),
            'chalk': join(opts.bundleHelpersDir, 'empty.js'),
          },
        },
        optimization: {
          minimize: false,
        },
        mode: 'production',
      },
      async (err, stats) => {
        if (err && err.message) {
          rejectBundle(err);
        } else {
          const info = stats.toJson({ errors: true });
          if (stats.hasErrors()) {
            const webpackError = info.errors.join('\n');
            rejectBundle(webpackError);
          } else {
            if (opts.isProd) {
              let code = await fs.readFile(outputFile, 'utf8');
              const minifyResults = terser.minify(code);
              if (minifyResults.error) {
                rejectBundle(minifyResults.error);
                return;
              }
              code = minifyResults.code;
              await fs.writeFile(outputFile, code);
            } else {
              await fs.copyFile(outputFile, cachedFile);
            }

            resolveBundle();
          }
        }
      },
    );
  });
}
