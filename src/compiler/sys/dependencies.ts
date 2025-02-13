import { CompilerDependency } from '../../declarations';
import { rollupVersion, version, terserVersion, typescriptVersion } from '../../version';

export const stencilDep: CompilerDependency = {
  name: '@stencil/core',
  version: version,
  main: 'compiler/stencil.min.js',
  resources: [
    'internal/index.d.ts',
    'internal/package.json',
    'internal/stencil-core.js',
    'internal/stencil-core.d.ts',
    'internal/stencil-ext-modules.d.ts',
    'internal/stencil-private.d.ts',
    'internal/stencil-public-compiler.d.ts',
    'internal/stencil-public-docs.d.ts',
    'internal/stencil-public-runtime.d.ts',
    'internal/client/css-shim.js',
    'internal/client/dom.js',
    'internal/client/index.js',
    'internal/client/patch.js',
    'internal/client/shadow-css.js',
    'internal/client/package.json',
    'package.json',
  ],
};

export const typecriptDep: CompilerDependency = {
  name: 'typescript',
  version: typescriptVersion,
  main: 'lib/typescript.js',
  resources: [
    'lib/lib.dom.d.ts',
    'lib/lib.es2015.d.ts',
    'lib/lib.es5.d.ts',
    'lib/lib.es2015.core.d.ts',
    'lib/lib.es2015.collection.d.ts',
    'lib/lib.es2015.generator.d.ts',
    'lib/lib.es2015.iterable.d.ts',
    'lib/lib.es2015.symbol.d.ts',
    'lib/lib.es2015.promise.d.ts',
    'lib/lib.es2015.proxy.d.ts',
    'lib/lib.es2015.reflect.d.ts',
    'lib/lib.es2015.symbol.wellknown.d.ts',
    'lib/lib.es2016.d.ts',
    'lib/lib.es2016.array.include.d.ts',
    'lib/lib.es2017.d.ts',
    'lib/lib.es2017.typedarrays.d.ts',
    'lib/lib.es2017.intl.d.ts',
    'lib/lib.es2017.object.d.ts',
    'lib/lib.es2017.sharedmemory.d.ts',
    'lib/lib.es2017.string.d.ts',
    'lib/lib.es2018.d.ts',
    'lib/lib.es2018.asyncgenerator.d.ts',
    'lib/lib.es2018.asynciterable.d.ts',
    'lib/lib.es2018.promise.d.ts',
    'lib/lib.es2018.regexp.d.ts',
    'lib/lib.es2018.intl.d.ts',
    'lib/lib.esnext.intl.d.ts',
    'lib/lib.es2020.bigint.d.ts',
    'package.json',
  ],
};

export const rollupDep: CompilerDependency = {
  name: 'rollup',
  version: rollupVersion,
  main: 'dist/rollup.browser.es.js',
};

export const terserDep: CompilerDependency = {
  name: 'terser',
  version: terserVersion,
  main: 'dist/bundle.min.js',
};

export const dependencies = [stencilDep, typecriptDep, rollupDep, terserDep];
