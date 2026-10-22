// Pagepilot styles. Shipped as a string and injected at runtime, so the
// package works without a bundler or CSS loader. Theme via the --pp-* custom
// properties (set from the config: accent, accentSoft, font).

export default `
:root {
  --pp-accent: #e60000;
  --pp-accent-soft: #ff4d4d;
  --pp-font: Inter, system-ui, -apple-system, "Segoe UI", sans-serif;
}

.pp {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  font-family: var(--pp-font);
  font-size: 13px;
  line-height: 1.4;
  color: #f3f4f6;
  text-align: left;
  -webkit-font-smoothing: antialiased;
}
.pp *,
.pp *::before,
.pp *::after {
  box-sizing: border-box;
}
.pp svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex: none;
}
.pp .pp__mark {
  fill: var(--pp-accent);
  stroke: none;
}
.pp [hidden] {
  display: none !important;
}
.pp a,
.pp button {
  font-family: inherit;
}
.pp.is-dragging {
  user-select: none;
}
.pp.is-dragging .pp__fab,
.pp.is-dragging .pp__head {
  cursor: grabbing;
}
.pp.is-dragging .pp__fab {
  transform: scale(1.12);
}

.pp__fab {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 50%;
  background: rgba(19, 21, 26, 0.94);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.35);
  cursor: grab;
  touch-action: none;
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  animation: pp-pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.pp__fab .pp__mark {
  width: 18px;
  height: 18px;
  margin-left: 2px;
}
.pp__fab:hover {
  transform: scale(1.08);
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4), 0 0 0 4px color-mix(in srgb, var(--pp-accent) 25%, transparent), 0 10px 28px rgba(0, 0, 0, 0.4);
}
.pp__fab:focus-visible {
  outline: none;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4), 0 0 0 4px color-mix(in srgb, var(--pp-accent) 50%, transparent);
}
.pp__fab.has-badge::after {
  content: "";
  position: absolute;
  top: 1px;
  right: 1px;
  width: 9px;
  height: 9px;
  border: 2px solid #13151a;
  border-radius: 50%;
  background: #fbbf24;
}

.pp__card {
  width: 340px;
  max-width: calc(100vw - 24px);
  background: rgba(19, 21, 26, 0.94);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5), 0 24px 48px rgba(0, 0, 0, 0.45);
  overflow: hidden;
  animation: pp-in 0.22s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.pp__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 8px 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  cursor: grab;
  touch-action: none;
  user-select: none;
}
.pp__head .pp__mark {
  width: 16px;
  height: 16px;
}

.pp__title {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.pp__market {
  padding: 2px 7px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--pp-accent) 16%, transparent);
  color: var(--pp-accent-soft);
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.pp__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin: 0 0 0 auto;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #9aa3ae;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.pp__icon-btn svg {
  width: 14px;
  height: 14px;
}
.pp__icon-btn:hover, .pp__icon-btn:focus-visible {
  background: rgba(255, 255, 255, 0.09);
  color: #f3f4f6;
  outline: none;
}
.pp__icon-btn + .pp__icon-btn {
  margin-left: 0;
}

.pp__body {
  height: min(64vh, 520px);
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
}

.pp__section {
  padding: 12px 14px;
}
.pp__section + .pp__section {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.pp__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 8px;
  padding: 0;
  border: 0;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #6b7280;
}
.pp__heading::before, .pp__heading::after {
  content: none;
}

.pp__count {
  letter-spacing: 0;
  font-variant-numeric: tabular-nums;
  color: #9aa3ae;
}

.pp__bolt.is-active {
  background: rgba(251, 191, 36, 0.16);
  color: #fbbf24;
}
.pp__bolt.is-active svg {
  fill: currentColor;
}

.pp__row-extra {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 0 0 40px;
}
.pp__row-extra .pp__btn {
  flex: none;
}

.pp__row.is-disabled {
  cursor: default;
  opacity: 0.5;
}

.pp__panel .pp__row + .pp__row {
  margin-top: 12px;
}

.pp__card--compact {
  width: 212px;
}
.pp__card--compact .pp__head {
  padding: 6px 6px 6px 12px;
}

.pp__compact-body {
  padding: 8px;
}

.pp__tiles--compact {
  gap: 4px;
}
.pp__tiles--compact .pp__tile {
  align-items: center;
  padding: 6px 4px;
  border-radius: 8px;
}
.pp__tiles--compact .pp__tile-key {
  font-size: 12px;
}
.pp__tiles--compact .pp__tile-flag {
  top: 4px;
  right: 4px;
  width: 5px;
  height: 5px;
}

.pp__tiles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.pp__tile {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  padding: 7px 8px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: #f3f4f6;
  text-decoration: none !important;
  transition: background 0.15s, border-color 0.15s, transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.pp__tile:is(a):hover, .pp__tile:is(a):focus-visible {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.12);
  color: #f3f4f6;
  outline: none;
  transform: translateY(-1px);
}
.pp__tile.is-current {
  background: color-mix(in srgb, var(--pp-accent) 14%, transparent);
  border-color: color-mix(in srgb, var(--pp-accent) 55%, transparent);
}
.pp__tile.is-current .pp__tile-key {
  color: var(--pp-accent-soft);
}
.pp__tile.is-missing {
  background: transparent;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  opacity: 0.55;
}

.pp__tile-key {
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.pp__tile-name {
  overflow: hidden;
  font-size: 10.5px;
  color: #9aa3ae;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.pp__tile-tag {
  margin-left: 4px;
  padding: 0 3px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: #9aa3ae;
  font-size: 8.5px;
  font-weight: 700;
  line-height: 1.6;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  vertical-align: 1px;
}

.pp__editor-mode {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(251, 191, 36, 0.35);
  border-radius: 8px;
  background: rgba(251, 191, 36, 0.08);
  color: #fbbf24;
  font-size: 11.5px;
}
.pp__editor-mode .pp__link-btn {
  flex: none;
  white-space: nowrap;
}

.pp__tile-flag {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #9aa3ae;
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.06);
}

.pp__row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 0;
  font-weight: 400;
  cursor: pointer;
}

.pp__row-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: #9aa3ae;
}

.pp__row-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.pp__row-title {
  font-weight: 500;
}

.pp__row-hint {
  font-size: 11px;
  color: #6b7280;
}

.pp__switch-input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  opacity: 0;
}

.pp__switch {
  position: relative;
  flex: none;
  width: 36px;
  height: 20px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  transition: background 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.pp__switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.pp__switch-input:checked + .pp__switch {
  background: var(--pp-accent);
}
.pp__switch-input:checked + .pp__switch::after {
  transform: translateX(16px);
}
.pp__switch-input:focus-visible + .pp__switch {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pp-accent) 45%, transparent);
}

.pp__actions {
  display: flex;
  gap: 6px;
}

.pp__btn {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0;
  padding: 7px 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: #f3f4f6 !important;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  text-decoration: none !important;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.pp__btn svg {
  width: 14px;
  height: 14px;
  color: #9aa3ae;
}
.pp__btn:hover, .pp__btn:focus-visible {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.16);
  outline: none;
}

.pp__checks {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.pp__checks li::before {
  content: none;
}

.pp__check {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin: 0;
  padding: 3px 0;
}

.pp__check-label {
  color: #9aa3ae;
  font-size: 12px;
}

.pp__pill {
  flex: none;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.pp__pill.is-ok {
  background: rgba(52, 211, 153, 0.14);
  color: #34d399;
}
.pp__pill.is-warn {
  background: rgba(251, 191, 36, 0.14);
  color: #fbbf24;
}
.pp__pill.is-error {
  background: rgba(248, 113, 113, 0.16);
  color: #f87171;
}
.pp__pill.is-muted {
  background: rgba(255, 255, 255, 0.05);
  color: #9aa3ae;
}

.pp__value {
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.pp__note {
  margin: 0 0 8px;
  font-size: 11.5px;
  line-height: 1.45;
  color: #6b7280;
}
.pp__note.is-warn {
  color: #fbbf24;
}
.pp__note em {
  font-style: italic;
}

.pp__stack {
  display: grid;
  gap: 10px;
}

.pp__segmented {
  display: flex;
  gap: 2px;
  padding: 3px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.25);
}

.pp__seg {
  flex: 1;
  padding: 5px 8px;
  border-radius: 7px;
  color: #9aa3ae !important;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  text-decoration: none !important;
  transition: background 0.15s, color 0.15s;
}
.pp__seg:is(a):hover, .pp__seg:is(a):focus-visible {
  background: rgba(255, 255, 255, 0.09);
  color: #f3f4f6 !important;
  outline: none;
}
.pp__seg.is-current {
  background: rgba(255, 255, 255, 0.1);
  color: #f3f4f6 !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.pp__tabs {
  display: flex;
  gap: 2px;
  padding: 6px 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.pp__tab {
  position: relative;
  flex: 1;
  margin: 0;
  padding: 7px 4px 9px;
  border: 0;
  background: transparent;
  color: #9aa3ae;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s;
}
.pp__tab::after {
  content: "";
  position: absolute;
  left: 20%;
  right: 20%;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: transparent;
  transition: background 0.15s;
}
.pp__tab:hover, .pp__tab:focus-visible {
  color: #f3f4f6;
  outline: none;
}
.pp__tab[aria-selected=true] {
  color: #f3f4f6;
}
.pp__tab[aria-selected=true]::after {
  background: var(--pp-accent);
}

.pp__btn--primary {
  flex: none;
  border-color: color-mix(in srgb, var(--pp-accent) 60%, transparent);
  background: color-mix(in srgb, var(--pp-accent) 18%, transparent);
}
.pp__btn--primary svg {
  color: var(--pp-accent-soft);
}
.pp__btn--primary:hover, .pp__btn--primary:focus-visible {
  background: color-mix(in srgb, var(--pp-accent) 28%, transparent);
  border-color: var(--pp-accent);
}

.pp__panel > .pp__section > div > .pp__btn {
  margin-top: 4px;
}

.pp__link-btn {
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: var(--pp-accent-soft);
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
}

.pp__serp {
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff;
  font-family: Arial, sans-serif;
}

.pp__serp-url {
  overflow: hidden;
  font-size: 12px;
  color: #4d5156;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.pp__serp-title {
  margin: 2px 0 3px;
  font-size: 17px;
  line-height: 1.3;
  color: #1a0dab;
}

.pp__serp-desc {
  font-size: 12.5px;
  line-height: 1.5;
  color: #4d5156;
}

.pp__social {
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
}

.pp__social-img {
  aspect-ratio: 1.91/1;
  background: center/cover no-repeat;
}
.pp__social-img.is-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 4/1;
  background: repeating-linear-gradient(45deg, transparent 0 8px, rgba(255, 255, 255, 0.04) 8px 16px);
  color: #6b7280;
  font-size: 11.5px;
}

.pp__social-text {
  padding: 8px 10px;
}

.pp__social-title {
  font-size: 13px;
  font-weight: 600;
}

.pp__social-desc {
  font-size: 11.5px;
  color: #9aa3ae;
}

.pp__social + .pp__note {
  margin: 8px 0 0;
  color: #fbbf24;
}

.pp__outline {
  margin: 0;
  padding: 0;
  list-style: none;
}
.pp__outline li {
  margin: 0;
  padding: 0 0 0 calc((var(--level) - 1) * 12px);
}
.pp__outline li::before {
  content: none;
}
.pp__outline button {
  display: flex;
  align-items: baseline;
  gap: 6px;
  width: 100%;
  margin: 0;
  padding: 3px 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #f3f4f6;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}
.pp__outline button:hover, .pp__outline button:focus-visible {
  background: rgba(255, 255, 255, 0.09);
  outline: none;
}
.pp__outline button.is-skipped .pp__h-tag {
  background: rgba(251, 191, 36, 0.18);
  color: #fbbf24;
}
.pp__outline button.is-hidden {
  opacity: 0.45;
}

.pp__h-tag {
  flex: none;
  padding: 0 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  color: #9aa3ae;
  font-size: 10px;
  font-weight: 700;
}

.pp__ld {
  margin: 0 0 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
}
.pp__ld summary {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.pp__ld.is-invalid summary {
  color: #f87171;
}
.pp__ld pre {
  max-height: 220px;
  margin: 0;
  padding: 8px 10px;
  overflow: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
  color: #9aa3ae;
  font: 11px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
  white-space: pre;
}

.pp__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 0 0 8px;
}

.pp__progress {
  height: 4px;
  margin: 0 0 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
}
.pp__progress span {
  display: block;
  height: 100%;
  background: var(--pp-accent);
  transition: width 0.2s;
}

.pp__progress-row {
  display: flex;
  justify-content: space-between;
  margin: 0 0 8px;
  font-size: 11.5px;
  color: #9aa3ae;
}

.pp__results {
  margin: 0 0 8px;
  padding: 0;
  list-style: none;
}
.pp__results li {
  margin: 0;
  padding: 0;
}
.pp__results li::before {
  content: none;
}
.pp__results button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin: 0;
  padding: 4px 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #f3f4f6;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}
.pp__results button:hover, .pp__results button:focus-visible {
  background: rgba(255, 255, 255, 0.09);
  outline: none;
}

.pp__result-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.pp__viewport {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
}

.pp__bp {
  padding: 2px 9px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--pp-accent) 16%, transparent);
  color: var(--pp-accent-soft);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.pp__mods {
  margin: 0;
  padding: 0;
  list-style: none;
}
.pp__mods li {
  margin: 0;
  padding: 0;
}
.pp__mods li::before {
  content: none;
}
.pp__mods ul {
  margin: 2px 0 8px;
  padding: 0;
  list-style: none;
}

.pp__mod-head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
  font-size: 12.5px;
  font-weight: 600;
}
.pp__mod-head .pp__count {
  margin-left: auto;
}

.pp__mod-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pp__mod-target {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 6px;
  min-width: 0;
  margin: 0;
  padding: 3px 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #9aa3ae;
  font-size: 11.5px;
  text-align: left;
  cursor: pointer;
}
.pp__mod-target svg {
  width: 12px;
  height: 12px;
}
.pp__mod-target span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.pp__mod-target:hover, .pp__mod-target:focus-visible {
  background: rgba(255, 255, 255, 0.09);
  color: #f3f4f6;
  outline: none;
}

.pp__chip {
  flex: none;
  margin: 0;
  padding: 2px 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.05);
  color: #9aa3ae;
  font-size: 10.5px;
  font-weight: 600;
  cursor: pointer;
}
.pp__chip:hover, .pp__chip:focus-visible {
  border-color: rgba(255, 255, 255, 0.2);
  color: #f3f4f6;
  outline: none;
}
.pp__chip.is-active {
  border-color: color-mix(in srgb, var(--pp-accent) 60%, transparent);
  background: color-mix(in srgb, var(--pp-accent) 18%, transparent);
  color: var(--pp-accent-soft);
}

.pp-flash,
.pp-hover {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}
.pp-flash.is-visible,
.pp-hover.is-visible {
  opacity: 1;
}

.pp-flash {
  border: 2px solid var(--pp-accent);
  border-radius: 6px;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--pp-accent) 25%, transparent), 0 0 0 9999px rgba(0, 0, 0, 0.12);
}

.pp-hover {
  background: color-mix(in srgb, var(--pp-accent) 8%, transparent);
  outline: 2px dashed color-mix(in srgb, var(--pp-accent) 80%, transparent);
  transition: none;
}

.pp-raw {
  outline: 2px dashed #fbbf24 !important;
  outline-offset: 2px;
}

.pp-grid {
  position: fixed;
  top: 0;
  bottom: 0;
  z-index: 9998;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  box-sizing: border-box;
  pointer-events: none;
}
.pp-grid span {
  background: color-mix(in srgb, var(--pp-accent) 8%, transparent);
  box-shadow: inset 1px 0 0 color-mix(in srgb, var(--pp-accent) 35%, transparent), inset -1px 0 0 color-mix(in srgb, var(--pp-accent) 35%, transparent);
}

@keyframes pp-in {
  from {
    opacity: 0;
    transform: translateY(6px) scale(0.98);
  }
}
@keyframes pp-pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
}
@media (prefers-reduced-motion: reduce) {
  .pp__card,
  .pp__fab {
    animation: none;
  }
}
`;
