"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
const unplugin_swc_1 = __importDefault(require("unplugin-swc"));
exports.default = (0, config_1.defineConfig)({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.spec.ts', 'test/**/*.e2e.spec.ts'],
        exclude: ['node_modules', 'dist'],
        testTimeout: 30000,
        deps: {
            optimizer: {
                ssr: {
                    exclude: [/node_modules/],
                },
            },
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'dist/',
                '**/*.spec.ts',
                '**/*.e2e.spec.ts',
                '**/*.test.ts',
                '**/main.ts',
            ],
        },
        setupFiles: ['reflect-metadata'],
        pool: 'forks',
    },
    plugins: [unplugin_swc_1.default.vite()],
    css: {
        postcss: null,
    },
    resolve: {
        alias: {
            '@': '/src',
        },
    },
});
//# sourceMappingURL=vitest.config.js.map