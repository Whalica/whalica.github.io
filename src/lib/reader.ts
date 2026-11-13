/**
 * 文章阅读辅助：
 * 1. 目录跟随正文滚动，高亮当前所在小节
 * 2. 正文划线 / 记号 / 批注，存在 localStorage，key 按文章区分
 */
type MarkColor = "yellow" | "green" | "blue" | "wavy";

interface Mark {
  id: string;
  block: number;
  start: number;
  end: number;
  color: MarkColor;
  text: string;
  note: string;
  created: number;
}

const BLOCK_SELECTOR = "p, h2, h3, li";
const STORE_PREFIX = "whalica:marks:";
const COLORS: { key: MarkColor; label: string; title: string }[] = [
  { key: "yellow", label: "黄", title: "黄色荧光笔" },
  { key: "green", label: "绿", title: "绿色荧光笔" },
  { key: "blue", label: "蓝", title: "蓝色荧光笔" },
  { key: "wavy", label: "红", title: "红色波浪线" },
];

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `m${Date.now()}${Math.random().toString(16).slice(2, 8)}`;

/* ---------- 目录跟随 ---------- */
export function initTocSpy() {
  const nav = document.querySelector<HTMLElement>(".article-sidebar nav");
  if (!nav) return;
  const links = Array.from(
    nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'),
  );
  if (links.length === 0) return;

  const entries = links
    .map((link) => {
      const hash = decodeURIComponent((link.getAttribute("href") ?? "").slice(1));
      const el = hash ? document.getElementById(hash) : null;
      return el ? { link, el } : null;
    })
    .filter((entry): entry is { link: HTMLAnchorElement; el: HTMLElement } =>
      entry !== null,
    );
  if (entries.length === 0) return;

  let current: HTMLAnchorElement | null = null;
  let queued = false;

  const update = () => {
    queued = false;
    const threshold = 120;
    let active: (typeof entries)[number] | null = null;
    for (const entry of entries) {
      if (entry.el.getBoundingClientRect().top <= threshold) active = entry;
      else break;
    }
    const next = active ? active.link : null;
    if (next === current) return;
    current = next;
    for (const { link } of entries) {
      link.classList.toggle("is-active", link === next);
      if (link === next) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    }
    if (!next) return;
    const navBox = nav.getBoundingClientRect();
    const linkBox = next.getBoundingClientRect();
    if (linkBox.top < navBox.top || linkBox.bottom > navBox.bottom) {
      nav.scrollTop += linkBox.top - navBox.top - 8;
    }
  };

  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}

/* ---------- 记号与批注 ---------- */
export function initReader() {
  const proseEl = document.querySelector<HTMLElement>(".prose");
  const article = document.querySelector<HTMLElement>("[data-post-id]");
  const panel = document.querySelector<HTMLElement>("#note-list");
  const countBox = document.querySelector<HTMLElement>("#note-count");
  const emptyHint = document.querySelector<HTMLElement>("#note-empty");
  if (!proseEl || !article) return;
  const prose: HTMLElement = proseEl;

  const postId = article.dataset.postId ?? "unknown";
  const storageKey = `${STORE_PREFIX}${postId}`;
  const blocks = Array.from(prose.querySelectorAll<HTMLElement>(BLOCK_SELECTOR));

  let marks: Mark[] = read();

  /* --- 存储 --- */
  function read(): Mark[] {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (item): item is Mark =>
          !!item &&
          typeof item === "object" &&
          typeof (item as Mark).id === "string" &&
          typeof (item as Mark).block === "number" &&
          typeof (item as Mark).start === "number" &&
          typeof (item as Mark).end === "number" &&
          typeof (item as Mark).text === "string",
      );
    } catch {
      return [];
    }
  }

  function write() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(marks));
    } catch {
      /* 隐私模式或配额满时静默失败 */
    }
  }

  /* --- 文本偏移 --- */
  function textNodesOf(root: Element): Text[] {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let node = walker.nextNode();
    while (node) {
      nodes.push(node as Text);
      node = walker.nextNode();
    }
    return nodes;
  }

  function offsetOfPoint(block: Element, node: Node, offset: number) {
    const range = document.createRange();
    range.selectNodeContents(block);
    try {
      range.setEnd(node, offset);
    } catch {
      return 0;
    }
    return range.toString().length;
  }

  function rangeOf(block: Element, start: number, end: number) {
    const range = document.createRange();
    let pos = 0;
    let started = false;
    for (const node of textNodesOf(block)) {
      const next = pos + node.data.length;
      if (!started && start <= next) {
        range.setStart(node, Math.max(0, start - pos));
        started = true;
      }
      if (started && end <= next) {
        range.setEnd(node, Math.max(0, end - pos));
        return range;
      }
      pos = next;
    }
    return null;
  }

  function blockOf(node: Node | null): HTMLElement | null {
    if (!node) return null;
    const el = node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : node.parentElement;
    const block = el?.closest<HTMLElement>(BLOCK_SELECTOR) ?? null;
    return block && prose.contains(block) ? block : null;
  }

  /* --- 划线应用 --- */
  function applyMark(mark: Mark) {
    const block = blocks[mark.block];
    if (!block) return false;
    if (block.querySelector(`[data-mark-id="${mark.id}"]`)) return true;

    const text = block.textContent ?? "";
    let start = mark.start;
    let end = mark.end;
    if (text.slice(start, end) !== mark.text) {
      const first = text.indexOf(mark.text);
      if (first < 0 || text.indexOf(mark.text, first + 1) >= 0) return false;
      start = first;
      end = first + mark.text.length;
    }

    const range = rangeOf(block, start, end);
    if (!range || range.collapsed) return false;
    const el = document.createElement("mark");
    el.className = `hl hl-${mark.color}${mark.note ? " has-note" : ""}`;
    el.dataset.markId = mark.id;
    try {
      const fragment = range.extractContents();
      el.append(fragment);
      range.insertNode(el);
    } catch {
      return false;
    }
    return true;
  }

  function repaintAll() {
    for (const el of Array.from(document.querySelectorAll(".hl"))) {
      const parent = el.parentNode;
      el.replaceWith(...Array.from(el.childNodes));
      parent?.normalize();
    }
    const ordered = [...marks].sort((a, b) => b.block - a.block || b.start - a.start);
    for (const mark of ordered) applyMark(mark);
  }

  /* --- 界面 --- */
  const toolbar = document.createElement("div");
  toolbar.className = "hl-toolbar";
  toolbar.hidden = true;
  toolbar.setAttribute("role", "toolbar");
  toolbar.setAttribute("aria-label", "记号工具");
  for (const color of COLORS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.color = color.key;
    btn.title = color.title;
    btn.setAttribute("aria-label", color.title);
    btn.className = `hl-swatch hl-swatch-${color.key}`;
    btn.textContent = color.label;
    toolbar.append(btn);
  }
  const noteBtn = document.createElement("button");
  noteBtn.type = "button";
  noteBtn.className = "hl-note-btn";
  noteBtn.title = "加一条笔记";
  noteBtn.setAttribute("aria-label", "加一条笔记");
  noteBtn.textContent = "✎";
  toolbar.append(noteBtn);
  document.body.append(toolbar);

  const pop = document.createElement("div");
  pop.className = "hl-pop";
  pop.hidden = true;
  pop.innerHTML =
    '<textarea rows="3" placeholder="在笔记里写点什么…"></textarea>' +
    '<div class="hl-pop-actions">' +
    '<button type="button" data-act="save">保存</button>' +
    '<button type="button" data-act="remove" class="danger">删除记号</button>' +
    "</div>";
  document.body.append(pop);
  const textarea = pop.querySelector("textarea")!;

  let pendingSelection:
    | { blockIndex: number; start: number; end: number; text: string }
    | null = null;
  let editingId: string | null = null;

  function hideToolbar() {
    toolbar.hidden = true;
    pendingSelection = null;
  }

  function hidePop() {
    pop.hidden = true;
    editingId = null;
  }

  function place(el: HTMLElement, rect: DOMRect) {
    el.hidden = false;
    const box = el.getBoundingClientRect();
    const top = window.scrollY + rect.top - box.height - 10;
    const left = Math.min(
      Math.max(8, window.scrollX + rect.left + rect.width / 2 - box.width / 2),
      window.scrollX + document.documentElement.clientWidth - box.width - 8,
    );
    el.style.top = `${Math.max(window.scrollY + 8, top)}px`;
    el.style.left = `${left}px`;
  }

  function selectionInfo() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
    const range = sel.getRangeAt(0);
    const startBlock = blockOf(range.startContainer);
    const endBlock = blockOf(range.endContainer);
    if (!startBlock || startBlock !== endBlock) return null;
    const index = blocks.indexOf(startBlock);
    if (index < 0) return null;
    const start = offsetOfPoint(startBlock, range.startContainer, range.startOffset);
    const end = offsetOfPoint(startBlock, range.endContainer, range.endOffset);
    const text = range.toString();
    if (end <= start || !text.trim()) return null;
    return { blockIndex: index, start, end, text, rect: range.getBoundingClientRect() };
  }

  function refreshToolbar() {
    const info = selectionInfo();
    if (!info) {
      hideToolbar();
      return;
    }
    pendingSelection = {
      blockIndex: info.blockIndex,
      start: info.start,
      end: info.end,
      text: info.text,
    };
    place(toolbar, info.rect);
  }

  function createMark(color: MarkColor, withNote: boolean) {
    if (!pendingSelection) return;
    const mark: Mark = {
      id: uid(),
      block: pendingSelection.blockIndex,
      start: pendingSelection.start,
      end: pendingSelection.end,
      color,
      text: pendingSelection.text,
      note: "",
      created: Date.now(),
    };
    marks.push(mark);
    repaintAll();
    write();
    renderPanel();
    const el = prose.querySelector<HTMLElement>(`[data-mark-id="${mark.id}"]`);
    window.getSelection()?.removeAllRanges();
    hideToolbar();
    if (withNote && el) openPop(el, mark.id);
  }

  function openPop(el: HTMLElement, id: string) {
    const mark = marks.find((item) => item.id === id);
    if (!mark) return;
    hideToolbar();
    editingId = id;
    textarea.value = mark.note;
    place(pop, el.getBoundingClientRect());
    textarea.focus();
  }

  toolbar.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const color = target.closest<HTMLElement>("[data-color]")?.dataset.color;
    if (color) {
      createMark(color as MarkColor, false);
      return;
    }
    if (target.closest(".hl-note-btn")) createMark("yellow", true);
  });

  pop.addEventListener("click", (event) => {
    const act = (event.target as HTMLElement).closest<HTMLElement>("[data-act]")?.dataset.act;
    if (!act || !editingId) return;
    if (act === "save") {
      const mark = marks.find((item) => item.id === editingId);
      if (mark) {
        mark.note = textarea.value.trim();
        write();
        repaintAll();
        renderPanel();
      }
      hidePop();
      return;
    }
    if (act === "remove") {
      marks = marks.filter((item) => item.id !== editingId);
      write();
      repaintAll();
      renderPanel();
      hidePop();
    }
  });

  prose.addEventListener("click", (event) => {
    const el = (event.target as HTMLElement).closest<HTMLElement>(".hl");
    if (!el?.dataset.markId) return;
    openPop(el, el.dataset.markId);
  });

  document.addEventListener("mouseup", () => {
    window.setTimeout(refreshToolbar, 10);
  });
  document.addEventListener("keyup", (event) => {
    if (event.key === "Escape") {
      hideToolbar();
      hidePop();
    }
  });
  document.addEventListener("mousedown", (event) => {
    const target = event.target as Node;
    if (toolbar.contains(target)) return;
    if (pop.contains(target)) return;
    if ((target as HTMLElement).closest?.(".hl")) return;
    hidePop();
  });
  window.addEventListener("scroll", hideToolbar, { passive: true });

  /* --- 笔记面板 --- */
  function renderPanel() {
    if (!panel) return;
    panel.innerHTML = "";
    const sorted = [...marks].sort((a, b) => a.block - b.block || a.start - b.start);
    for (const mark of sorted) {
      const li = document.createElement("li");
      li.className = "note-item";
      li.dataset.markId = mark.id;
      li.dataset.color = mark.color;

      const jump = document.createElement("button");
      jump.type = "button";
      jump.className = "note-jump";
      jump.textContent = mark.text.length > 42 ? `${mark.text.slice(0, 42)}…` : mark.text;
      jump.addEventListener("click", () => {
        const el = prose.querySelector<HTMLElement>(`[data-mark-id="${mark.id}"]`);
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
        el?.classList.add("is-flash");
        window.setTimeout(() => el?.classList.remove("is-flash"), 900);
      });

      const del = document.createElement("button");
      del.type = "button";
      del.className = "note-del";
      del.title = "删除";
      del.setAttribute("aria-label", "删除这条记号");
      del.textContent = "✕";
      del.addEventListener("click", () => {
        marks = marks.filter((item) => item.id !== mark.id);
        write();
        repaintAll();
        renderPanel();
      });

      li.append(jump, del);
      if (mark.note) {
        const p = document.createElement("p");
        p.className = "note-text";
        p.textContent = mark.note;
        li.append(p);
      }
      panel.append(li);
    }
    if (countBox) countBox.textContent = String(marks.length);
    if (emptyHint) emptyHint.hidden = marks.length > 0;
  }

  repaintAll();
  renderPanel();
}
