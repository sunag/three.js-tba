
import { defineConfig } from 'vite';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';

export default defineConfig({
	root: 'conversor',
	base: './',
	plugins: [ monacoEditorPlugin.default({ languages: ['javascript'] }) ]
});
