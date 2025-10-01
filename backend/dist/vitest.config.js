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
        include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
        root: './',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'dist/',
                '**/*.spec.ts',
                '**/*.config.ts',
            ],
        },
    },
    plugins: [unplugin_swc_1.default.vite()],
    resolve: {
        alias: {
            '@': '/src',
        },
    },
});
//# sourceMappingURL=vitest.config.js.map