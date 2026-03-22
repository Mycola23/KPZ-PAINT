import { CanvasEngine } from '../engine/CanvasEngine';
import { type ToolType } from './ToolFactory';

export class Toolbar {
    private readonly engine: CanvasEngine;
    private readonly container: HTMLElement;

    constructor(engine: CanvasEngine, containerId = 'paint-toolbar') {
        this.engine = engine;
        const element = document.getElementById(containerId);
        if (!element) throw new Error(`[Toolbar] Container #${containerId} not found.`);
        this.container = element;
        this.buildToolbar();
        this.bindEvents();
    }

    private buildToolbar(): void {
        this.container.innerHTML = `
      <div class="paint-toolbar__section paint-toolbar__section--tools">
        ${this.toolBtn('brush', 'B', `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3z"/><path d="M20.71 4.63l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z"/></svg>`)}
        ${this.toolBtn('eraser', 'E', `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.77-.78 2.04 0 2.83L5.03 20h7.66l8.72-8.72c.79-.78.79-2.05 0-2.83l-4.85-4.86C16.17 3.2 15.65 3 15.14 3z"/></svg>`)}
        ${this.toolBtn('line', 'L', `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`)}
        ${this.toolBtn('rectangle', 'R', `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><rect x="3" y="5" width="18" height="14" rx="1"/></svg>`)}
        ${this.toolBtn('circle', 'C', `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="9"/></svg>`)}
        ${this.toolBtn('fill', 'F', `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M16.56 8.94L7.62 0 6.21 1.41l2.38 2.38-5.15 5.15c-.59.56-.59 1.53 0 2.12l5.5 5.5c.29.29.68.44 1.06.44s.77-.15 1.06-.44l5.5-5.5c.59-.59.59-1.56 0-2.12zM5.21 10L10 5.21 14.79 10H5.21z"/></svg>`)}
      </div>

      <div class="paint-toolbar__section paint-toolbar__section--history">
        <button class="paint-toolbar__btn" id="btn-undo" title="Undo (Ctrl+Z)" disabled>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
        </button>
        <button class="paint-toolbar__btn" id="btn-redo" title="Redo (Ctrl+Y)" disabled>
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></svg>
        </button>
        <button class="paint-toolbar__btn paint-toolbar__btn--danger" id="btn-clear" title="Clear canvas">
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>

      <div class="paint-toolbar__section paint-toolbar__section--filters">
        <select class="paint-toolbar__select" id="filter-select">
          <option value="">— Filter —</option>
          <option value="grayscale">Grayscale</option>
          <option value="invert">Invert</option>
          <option value="sepia">Sepia</option>
          <option value="brightness+50">Brightness +50</option>
          <option value="brightness-50">Brightness -50</option>
        </select>
        <button class="paint-toolbar__btn paint-toolbar__btn--apply" id="btn-apply-filter">Apply</button>
      </div>

      <div class="paint-toolbar__section paint-toolbar__section--export">
        <button class="paint-toolbar__btn paint-toolbar__btn--export" data-format="png">PNG</button>
        <button class="paint-toolbar__btn paint-toolbar__btn--export" data-format="jpg">JPG</button>
        <button class="paint-toolbar__btn paint-toolbar__btn--export" data-format="json">JSON</button>
      </div>
    `;
    }

    private toolBtn(type: ToolType, key: string, icon: string): string {
        const active = type === 'brush' ? ' paint-toolbar__btn--active' : '';
        return `<button class="paint-toolbar__btn${active}" data-tool="${type}" title="${type[0].toUpperCase() + type.slice(1)} (${key})">${icon}</button>`;
    }

    private bindEvents(): void {
        this.container.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.engine.setTool(btn.dataset['tool'] as ToolType);
                this.setActiveTool(btn);
            });
        });

        // undo / redo / clear
        this.container.querySelector('#btn-undo')?.addEventListener('click', () => this.engine.undo());
        this.container.querySelector('#btn-redo')?.addEventListener('click', () => this.engine.redo());
        this.container.querySelector('#btn-clear')?.addEventListener('click', () => {
            if (confirm('Clear the canvas? This action can be undone.')) {
                this.engine.clear();
            }
        });

        // export
        this.container.querySelectorAll<HTMLButtonElement>('[data-format]').forEach(btn => {
            btn.addEventListener('click', () => {
                const fmt = btn.dataset['format'] as 'png' | 'jpg' | 'json';
                this.engine.exportAs('drawing', fmt);
            });
        });

        document.addEventListener('keydown', this.handleKeyboard);
    }
    private readonly handleKeyboard = (e: KeyboardEvent): void => {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            this.engine.undo();
            return;
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            this.engine.redo();
            return;
        }

        const shortcuts: Record<string, ToolType> = {
            b: 'brush',
            e: 'eraser',
            l: 'line',
            r: 'rectangle',
            c: 'circle',
            f: 'fill',
        };
        const tool = shortcuts[e.key.toLowerCase()];
        if (tool) {
            this.engine.setTool(tool);
            const btn = this.container.querySelector<HTMLButtonElement>(`[data-tool="${tool}"]`);
            if (btn) this.setActiveTool(btn);
        }
    };

    private setActiveTool(activeBtn: HTMLButtonElement): void {
        this.container.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('paint-toolbar__btn--active'));
        activeBtn.classList.add('paint-toolbar__btn--active');
    }
}

// ============================================================

export class ColorPicker {
    private readonly engine: CanvasEngine;
    private readonly container: HTMLElement;

    constructor(engine: CanvasEngine, containerId = 'paint-color-picker') {
        this.engine = engine;
        const element = document.getElementById(containerId);
        if (!element) throw new Error(`[ColorPicker] Container #${containerId} not found.`);
        this.container = element;

        this.build();
        this.bindEvents();
    }

    private build(): void {
        this.container.innerHTML = `
      <div class="color-picker">
        <div class="color-picker__main">
          <label class="color-picker__label">Color</label>
          <input type="color" class="color-picker__input" id="color-input" value="#000000">
        </div>

        <div class="color-picker__presets">
          ${[
              '#000000',
              '#ffffff',
              '#ff0000',
              '#00ff00',
              '#0000ff',
              '#ffff00',
              '#ff00ff',
              '#00ffff',
              '#ff8800',
              '#8800ff',
              '#888888',
              '#444444',
              '#ff4444',
              '#44ff44',
              '#4444ff',
          ]
              .map(
                  c =>
                      `<button class="color-picker__preset" data-color="${c}"
              style="background-color:${c}" title="${c}"></button>`,
              )
              .join('')}
        </div>

        <div class="color-picker__size">
          <label class="color-picker__label">
            Size: <span id="size-display">4</span>px
          </label>
          <input type="range" class="color-picker__range"
            id="size-input" min="1" max="100" value="4">
        </div>

        <div class="color-picker__opacity">
          <label class="color-picker__label">
            Opacity: <span id="opacity-display">100</span>%
          </label>
          <input type="range" class="color-picker__range"
            id="opacity-input" min="1" max="100" value="100">
        </div>
      </div>
    `;
    }

    private bindEvents(): void {
        const colorInput = this.container.querySelector<HTMLInputElement>('#color-input');
        const sizeInput = this.container.querySelector<HTMLInputElement>('#size-input');
        const sizeDisplay = this.container.querySelector<HTMLSpanElement>('#size-display');
        const opInput = this.container.querySelector<HTMLInputElement>('#opacity-input');
        const opDisplay = this.container.querySelector<HTMLSpanElement>('#opacity-display');

        colorInput?.addEventListener('input', e => {
            this.engine.setColor((e.target as HTMLInputElement).value);
        });

        sizeInput?.addEventListener('input', e => {
            const v = parseInt((e.target as HTMLInputElement).value, 10);
            this.engine.setSize(v);
            if (sizeDisplay) sizeDisplay.textContent = String(v);
        });

        opInput?.addEventListener('input', e => {
            const v = parseInt((e.target as HTMLInputElement).value, 10);
            this.engine.setOpacity(v / 100);
            if (opDisplay) opDisplay.textContent = String(v);
        });

        this.container.querySelectorAll<HTMLButtonElement>('[data-color]').forEach(btn => {
            btn.addEventListener('click', () => {
                const c = btn.dataset['color'] ?? '#000000';
                this.engine.setColor(c);
                if (colorInput) colorInput.value = c;
            });
        });
    }
}
