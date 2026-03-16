import { CanvasEngine } from './engine/CanvasEngine';
import { type ToolType } from './tools/ToolFactory';
import './style.scss';

class PaintApp {
    private engine!: CanvasEngine;
    private drawingId: number | null = null;
    init(): void {
        document.getElementById('app')!.innerHTML = this.buildHTML();
        const canvas = document.getElementById('paint-canvas') as HTMLCanvasElement;
        this.engine = CanvasEngine.init(canvas);
        this.wireToolbar();
        this.wireColorPicker();
        this.wireLayerPanel();
        this.wireKeyboard();
    }

    private buildHTML(): string {
        return `
        <div class="app">
        
        <!-- TOPBAR -->
        <header class="topbar">
            <div class="topbar__brand">😽 Paint</div>
        
            <div class="topbar__tools" id="tool-buttons">
            ${this.toolBtn('brush', 'B', '✏')}
            ${this.toolBtn('eraser', 'E', '⌫')}
            ${this.toolBtn('line', 'L', '╱')}
            ${this.toolBtn('rectangle', 'R', '▭')}
            ${this.toolBtn('circle', 'C', '◯')}
            ${this.toolBtn('fill', 'F', '▨')}
            </div>
        
            <div class="topbar__sep"></div>
        
            <button class="topbar__btn" id="btn-undo" title="Undo Ctrl+Z" disabled>↩</button>
            <button class="topbar__btn" id="btn-redo" title="Redo Ctrl+Y" disabled>↪</button>
            <button class="topbar__btn topbar__btn--danger" id="btn-clear" title="Clear">✕</button>
        
            <div class="topbar__sep"></div>
        
            <select class="topbar__select" id="filter-select">
            <option value="">Filter…</option>
            <option value="gray">Grayscale</option>
            <option value="invert">Invert</option>
            <option value="sepia">Sepia</option>
            <option value="bright+">Brightness +50</option>
            <option value="bright-">Brightness −50</option>
            </select>
            <button class="topbar__btn topbar__btn--accent" id="btn-filter">Apply</button>
        
            <div class="topbar__sep"></div>
        
            <button class="topbar__btn topbar__btn--ghost" id="exp-png">PNG</button>
            <button class="topbar__btn topbar__btn--ghost" id="exp-jpg">JPG</button>
            <button class="topbar__btn topbar__btn--ghost" id="exp-json">JSON</button>
        
            <div class="topbar__sep"></div>
        
            <input id="drawing-title" class="topbar__title-input" value="Untitled" maxlength="255">
            <button class="topbar__btn topbar__btn--save" id="btn-save">Save</button>
            <span class="topbar__status" id="save-status"></span>
        </header>
        
        <!-- MAIN  -->
        <div class="workspace">
        
            <!-- LEFT: color + size -->
            <aside class="sidebar sidebar--left">
            <label class="sidebar__label">Colour</label>
            <input type="color" id="color-pick" class="color-swatch" value="#1a1a2e">
        
            <label class="sidebar__label">Presets</label>
            <div class="color-presets" id="color-presets">
                ${[
                    '#1a1a2e',
                    '#e94560',
                    '#0f3460',
                    '#ffffff',
                    '#f5f5f5',
                    '#ff6b6b',
                    '#ffd93d',
                    '#6bcb77',
                    '#4d96ff',
                    '#c77dff',
                    '#000000',
                    '#555555',
                    '#aaaaaa',
                    '#ff8c42',
                    '#2ec4b6',
                ]
                    .map(c => `<button class="color-preset" data-c="${c}" style="background:${c}" title="${c}"></button>`)
                    .join('')}
            </div>
        
            <label class="sidebar__label">Size <span id="size-val">5</span>px</label>
            <input type="range" id="size-range" class="size-range" min="1" max="80" value="5">
            <label class="sidebar__label" style="margin-top:12px">Opacity <span id="opacity-val">100</span>%</label>
            <input type="range" id="opacity-range" class="size-range" min="1" max="100" value="100">
            </aside>
        
            <!-- CANVAS -->
            <main class="canvas-area">
            <canvas id="paint-canvas" class="canvas" width="900" height="620"></canvas>
            </main>
        
            <!-- RIGHT: layers -->
            <aside class="sidebar sidebar--right">
            <div class="layers-header">
                <span class="sidebar__label" style="margin:0">Layers</span>
                <button class="layer-add-btn" id="btn-add-layer" title="Add layer">＋</button>
            </div>
            <div class="layers-list" id="layers-list"></div>
            </aside>
        
        </div>
        
        
        <div class="gallery-backdrop hidden" id="gallery-backdrop"></div>
        <div class="gallery-drawer hidden" id="gallery-drawer">
            <div class="gallery-header">
            <span>Saved drawings</span>
            <button id="gallery-close">✕</button>
            </div>
            <div class="gallery-grid" id="gallery-grid">Loading…</div>
        </div>

        </div>
    `;
    }

    private toolBtn(type: ToolType, key: string, icon: string): string {
        return `<button class="topbar__tool${type === 'brush' ? ' topbar__tool--active' : ''}"
        data-tool="${type}" title="${type[0].toUpperCase() + type.slice(1)} (${key})">${icon}</button>`;
    }

    // =============================================================

    private wireToolbar(): void {
        document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.engine.setTool(btn.dataset['tool'] as ToolType);
                document.querySelectorAll('.topbar__tool').forEach(b => b.classList.remove('topbar__tool--active'));
                btn.classList.add('topbar__tool--active');
            });
        });

        getById('btn-undo')!.addEventListener('click', () => this.engine);
        getById('btn-redo')!.addEventListener('click', () => this.engine);
        getById('btn-clear')!.addEventListener('click', () => {
            if (confirm('Clear canvas? (Undo available)')) this.engine;
        });

        getById('btn-filter')!.addEventListener('click', () => {
            const selected = getById<HTMLSelectElement>('filter-select')!;
        });

        getById('exp-png')!.addEventListener('click', () => this.engine.exportAs('drawing', 'png'));
        getById('exp-jpg')!.addEventListener('click', () => this.engine.exportAs('drawing', 'jpg'));
        getById('exp-json')!.addEventListener('click', () => this.engine.exportAs('drawing', 'json'));
    }

    private wireColorPicker(): void {
        const pick = getById<HTMLInputElement>('color-pick')!;
        const range = getById<HTMLInputElement>('size-range')!;
        const sizeV = getById('size-val')!;
        const opR = getById<HTMLInputElement>('opacity-range')!;
        const opV = getById('opacity-val')!;

        pick.addEventListener('input', () => this.engine.setColor(pick.value));

        range.addEventListener('input', () => {
            const v = +range.value;
            this.engine.setSize(v);
            sizeV.textContent = String(v);
        });

        opR.addEventListener('input', () => {
            opV.textContent = opR.value;
            this.engine.setOpacity(+opR.value / 100);
        });

        document.querySelectorAll<HTMLButtonElement>('.color-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const c = btn.dataset['c']!;
                this.engine.setColor(c);
                pick.value = c;
            });
        });
    }

    private wireLayerPanel(): void {
        getById('btn-add-layer')!.addEventListener('click', () => {
            const name = prompt('Layer name:', `Layer ${this.engine.getLayers().length + 1}`);
            if (name) {
                this.engine.addLayer(name);
                this.renderLayerList();
            }
        });
        this.engine.getLayers().forEach(l => {
            if ('subscribe' in l) {
                (l as unknown as { subscribe: (cb: () => void) => void }).subscribe(() => this.renderLayerList());
            }
        });

        this.renderLayerList();
    }

    private renderLayerList(): void {
        const list = getById('layers-list')!;
        const layers = this.engine.getLayers();
        list.innerHTML = '';

        [...layers].reverse().forEach(layer => {
            const item = document.createElement('div');
            item.className = 'layer-item';
            item.dataset['id'] = layer.getId();
            item.innerHTML = `
        <span class="layer-eye${layer.isVisible() ? '' : ' off'}" data-lid="${layer.getId()}">👁</span>
        <span class="layer-name">${layer.getName()}</span>
        <span class="layer-lock${layer.isLocked() ? ' on' : ''}" data-lid="${layer.getId()}">🔒</span>
      `;
            item.addEventListener('click', () => {
                this.engine.setActiveLayer(layer.getId());
                document.querySelectorAll('.layer-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
            list.appendChild(item);
        });
        list.querySelector('.layer-item')?.classList.add('active');
    }

    private wireKeyboard(): void {
        const shortcuts: Record<string, ToolType> = {
            b: 'brush',
            e: 'eraser',
            l: 'line',
            r: 'rectangle',
            c: 'circle',
            f: 'fill',
        };

        document.addEventListener('keydown', ev => {
            const tag = (ev.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;

            if ((ev.ctrlKey || ev.metaKey) && ev.key === 'z') {
                ev.preventDefault();
                this.engine; // add undo
                return;
            }
            if ((ev.ctrlKey || ev.metaKey) && ev.key === 'y') {
                ev.preventDefault();
                this.engine; // ad redo
                return;
            }

            const tool = shortcuts[ev.key.toLowerCase()];
            if (tool) {
                this.engine.setTool(tool);
                document.querySelectorAll('.topbar__tool').forEach(b => b.classList.remove('topbar__tool--active'));
                document.querySelector<HTMLButtonElement>(`[data-tool="${tool}"]`)?.classList.add('topbar__tool--active');
            }
        });
    }
}

// === helpers ===

function getById<T extends HTMLElement = HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
}

const app = new PaintApp();
app.init();
