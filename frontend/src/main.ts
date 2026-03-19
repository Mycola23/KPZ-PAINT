import { CanvasEngine } from './engine/CanvasEngine';
import { GrayscaleFilter, InvertFilter, SepiaFilter, BrightnessFilter } from './filters/Filters';
import { type ToolType } from './tools/ToolFactory';
import './style.scss';
import { ApiClient } from './api/ApiClient';

class PaintApp {
    private engine!: CanvasEngine;
    private drawingId: number | null = null;
    private api = new ApiClient('/api');
    private autoTimer: ReturnType<typeof setInterval> | null = null;
    private static readonly AUTO_INTERVAL = 30_000;
    init(): void {
        document.getElementById('app')!.innerHTML = this.buildHTML();
        const canvas = document.getElementById('paint-canvas') as HTMLCanvasElement;
        this.engine = CanvasEngine.init(canvas);
        this.wireToolbar();
        this.wireColorPicker();
        this.wireLayerPanel();
        this.wireKeyboard();
        this.subscribeHistory();
        this.wireSave();
        setTimeout(() => this.checkAutosave(), 500);
        this.startAutosave();
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

        getById('btn-undo')!.addEventListener('click', () => this.engine.undo());
        getById('btn-redo')!.addEventListener('click', () => this.engine.redo());
        getById('btn-clear')!.addEventListener('click', () => {
            if (confirm('Clear canvas? (Undo available)')) this.engine.clear();
        });

        getById('btn-filter')!.addEventListener('click', () => {
            const selected = getById<HTMLSelectElement>('filter-select')!;
            const filterMap: Record<string, () => void> = {
                gray: () => this.engine.applyFilter(new GrayscaleFilter()),
                invert: () => this.engine.applyFilter(new InvertFilter()),
                sepia: () => this.engine.applyFilter(new SepiaFilter()),
                'bright+': () => this.engine.applyFilter(new BrightnessFilter(50)),
                'bright-': () => this.engine.applyFilter(new BrightnessFilter(-50)),
            };
            filterMap[selected.value]?.();
            selected.value = '';
        });

        getById('exp-png')!.addEventListener('click', () => this.engine.exportAs('drawing', 'png'));
        getById('exp-jpg')!.addEventListener('click', () => this.engine.exportAs('drawing', 'jpg'));
        getById('exp-json')!.addEventListener('click', () => this.engine.exportAs('drawing', 'json'));
    }

    private wireColorPicker(): void {
        const colorPicker = getById<HTMLInputElement>('color-pick')!;
        const sizeRange = getById<HTMLInputElement>('size-range')!;
        const sizeValue = getById('size-val')!;
        const opacityRange = getById<HTMLInputElement>('opacity-range')!;
        const opacityValue = getById('opacity-val')!;

        colorPicker.addEventListener('input', () => this.engine.setColor(colorPicker.value));

        sizeRange.addEventListener('input', () => {
            const v = +sizeRange.value;
            this.engine.setSize(v);
            sizeValue.textContent = String(v);
        });

        opacityRange.addEventListener('input', () => {
            opacityValue.textContent = opacityRange.value;
            this.engine.setOpacity(+opacityRange.value / 100);
        });

        document.querySelectorAll<HTMLButtonElement>('.color-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const c = btn.dataset['c']!;
                this.engine.setColor(c);
                colorPicker.value = c;
            });
        });
    }

    private wireLayerPanel(): void {
        getById('btn-add-layer')!.addEventListener('click', () => {
            const name = prompt('Layer name:', `Layer ${this.engine.getLayers().length + 1}`);
            if (name) {
                this.engine.addLayer(name);
            }
        });
        this.engine.subscribe(() => this.renderLayerList());

        this.renderLayerList();
    }

    private renderLayerList(): void {
        const list = getById('layers-list')!;
        const layers = this.engine.getLayers();
        const activeLayerId = this.engine
            .getLayers()
            .find(l => l.getId() === (this.engine as any).active?.getId())
            ?.getId();
        list.innerHTML = '';

        [...layers].reverse().forEach((layer, index) => {
            const isFirst = index === 0;
            const isLast = index === layers.length - 1;
            const item = document.createElement('div');
            item.className = `layer-item ${layer.getId() === activeLayerId ? 'active' : ''}`;
            item.dataset['id'] = layer.getId();
            item.innerHTML = `
            <div class="layer-item__main">
                <button class="layer-action btn-eye ${layer.isVisible() ? '' : 'off'}" title="Visibility">
                    ${layer.isVisible() ? '👁' : '─'}
                </button>
                <span class="layer-name" title="Double click to rename">${layer.getName()}</span>
                 <button class="layer-action btn-delete" title="Delete Layer">🗑</button>
                <button class="layer-action btn-lock ${layer.isLocked() ? 'on' : ''}" title="Lock">
                    ${layer.isLocked() ? '🔒' : '🔓'}
                </button>
            </div>
            <div class="layer-item__order">
                <button class="layer-move" data-dir="up" ${isFirst ? 'disabled' : ''}>▲</button>
                <button class="layer-move" data-dir="down" ${isLast ? 'disabled' : ''}>▼</button>
            </div>
        `;
            item.addEventListener('click', e => {
                if ((e.target as HTMLElement).classList.contains('layer-action') || (e.target as HTMLElement).classList.contains('layer-move'))
                    return;
                document.querySelectorAll('.layer-item').forEach(el => {
                    el.classList.remove('active');
                });
                this.engine.setActiveLayer(layer.getId());
            });

            item.querySelector('.layer-name')?.addEventListener('dblclick', () => {
                const newName = prompt('Rename layer:', layer.getName());
                if (newName) this.engine.renameLayer(layer.getId(), newName);
            });

            item.querySelector('.btn-eye')?.addEventListener('click', () => {
                this.engine.toggleLayerVisibility(layer.getId());
            });

            item.querySelector('.btn-lock')?.addEventListener('click', () => {
                this.engine.toggleLayerLock(layer.getId());
            });

            item.querySelectorAll('.layer-move').forEach(btn => {
                btn.addEventListener('click', e => {
                    const dir = (btn as HTMLElement).dataset['dir'] === 'up' ? 'up' : 'down';
                    this.engine.moveLayer(layer.getId(), dir);
                });
            });

            item.querySelector('.btn-delete')?.addEventListener('click', e => {
                e.stopPropagation();
                this.engine.removeLayer(layer.getId());
            });
            list.appendChild(item);
        });
    }

    private subscribeHistory(): void {
        this.engine.history.subscribe(state => {
            const undo = getById<HTMLButtonElement>('btn-undo')!;
            const redo = getById<HTMLButtonElement>('btn-redo')!;
            undo.disabled = !state.canUndo;
            undo.title = state.undoLabel ? `Undo: ${state.undoLabel} (Ctrl+Z)` : 'Undo (Ctrl+Z)';
            redo.disabled = !state.canRedo;
            redo.title = state.redoLabel ? `Redo: ${state.redoLabel} (Ctrl+Y)` : 'Redo (Ctrl+Y)';
        });
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
                this.engine.undo();
                return;
            }
            if ((ev.ctrlKey || ev.metaKey) && ev.key === 'y') {
                ev.preventDefault();
                this.engine.redo();
                return;
            }
            if (ev.shiftKey && ev.key.toLowerCase() === 's') {
                ev.preventDefault();
                this.saveToServer();
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

    private wireSave(): void {
        getById('btn-save')!.addEventListener('click', () => this.saveToServer());
    }

    private async saveToServer(): Promise<void> {
        const titleInput = getById<HTMLInputElement>('drawing-title');
        let title = titleInput?.value.trim() || '';

        if (!title || title === 'Untitled') {
            const now = new Date();
            title = `Draft ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
            if (titleInput) titleInput.value = title;
        }

        const status = getById('save-status')!;
        status.textContent = 'Saving…';
        status.className = 'topbar__status';

        try {
            const payload = {
                title,
                canvas_json: this.engine.getJson(),
                image_base64: this.engine.getBase64(),
                width: this.engine.getCanvasEl().width,
                height: this.engine.getCanvasEl().height,
            };

            if (this.drawingId) {
                await this.api.update(this.drawingId, payload);
            } else {
                this.drawingId = await this.api.save(payload);
            }

            this.api.clearAutosave();
            status.textContent = '✓ Saved';
            status.classList.add('topbar__status--ok');
            setTimeout(() => (status.textContent = ''), 3000);
        } catch (err) {
            status.textContent = '✗ Error';
            status.classList.add('topbar__status--err');
        }
    }

    private startAutosave(): void {
        this.autoTimer = setInterval(() => {
            const title = getById<HTMLInputElement>('drawing-title')?.value ?? 'Autosave';
            this.api.autosave(this.engine.getJson(), title);
        }, PaintApp.AUTO_INTERVAL);
    }

    private async loadDrawing(id: number): Promise<void> {
        const full = await this.api.get(id);
        if (full) {
            this.drawingId = full.id;
            const titleEl = getById<HTMLInputElement>('drawing-title');
            if (titleEl) titleEl.value = full.title;
            await this.engine.loadFromJson(full.canvas_json);
        }
    }

    private checkAutosave(): void {
        const saved = this.api.loadAutosave();
        if (!saved) return;

        const ago = Math.round((Date.now() - new Date(saved.ts).getTime()) / 60000);
        if (ago < 120) {
            const confirmRestore = confirm(`You have an unsaved drawing "${saved.title}" from ${ago} min ago. Restore it?`);
            if (confirmRestore) {
                const titleEl = getById<HTMLInputElement>('drawing-title');
                if (titleEl) titleEl.value = saved.title;
                this.engine.loadFromJson(saved.json);
            }
        }
        this.api.clearAutosave();
    }
    destroy(): void {
        if (this.autoTimer) clearInterval(this.autoTimer);
        CanvasEngine.reset();
    }
}

// === helpers ===

function getById<T extends HTMLElement = HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
}

const app = new PaintApp();
app.init();
