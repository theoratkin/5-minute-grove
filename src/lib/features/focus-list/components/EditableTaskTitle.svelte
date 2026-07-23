<script lang="ts">
	import { parseTaskTitle } from '../focusTask.hashtags';

	let { title, label, completed = false, onrename }: { title: string; label: string; completed?: boolean; onrename: (title: string) => void } = $props();
	let draft = $state<string | null>(null);
	let element = $state<HTMLElement>();

	function caretOffset(element: HTMLElement) {
		const selection = window.getSelection();
		if (!selection?.rangeCount) return (element.textContent ?? '').length;
		const range = selection.getRangeAt(0);
		if (!element.contains(range.endContainer)) return (element.textContent ?? '').length;
		const beforeCaret = range.cloneRange();
		beforeCaret.selectNodeContents(element);
		beforeCaret.setEnd(range.endContainer, range.endOffset);
		return beforeCaret.toString().length;
	}

	function restoreCaret(element: HTMLElement, offset: number) {
		const selection = window.getSelection();
		if (!selection) return;
		const range = document.createRange();
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
		let remaining = offset;
		let node = walker.nextNode();
		while (node) {
			const length = node.textContent?.length ?? 0;
			if (remaining <= length) {
				range.setStart(node, remaining);
				range.collapse(true);
				selection.removeAllRanges();
				selection.addRange(range);
				return;
			}
			remaining -= length;
			node = walker.nextNode();
		}
		range.selectNodeContents(element);
		range.collapse(false);
		selection.removeAllRanges();
		selection.addRange(range);
	}

	function renderHighlighted(element: HTMLElement, value: string, offset?: number) {
		const fragment = document.createDocumentFragment();
		for (const part of parseTaskTitle(value)) {
			if (part.type === 'hashtag') {
				const hashtag = document.createElement('span');
				hashtag.className = 'task-hashtag';
				hashtag.textContent = part.value;
				fragment.append(hashtag);
			} else {
				fragment.append(document.createTextNode(part.value));
			}
		}
		element.replaceChildren(fragment);
		if (offset !== undefined) restoreCaret(element, Math.min(offset, value.length));
	}

	function update(element: HTMLElement) {
		const offset = caretOffset(element);
		const text = (element.textContent ?? '').replace(/[\r\n]+/g, ' ');
		draft = text.slice(0, 80);
		renderHighlighted(element, draft, offset);
	}

	function commit() {
		const nextTitle = (draft ?? title).replace(/\s+/g, ' ').trim().slice(0, 80);
		if (nextTitle && nextTitle !== title) onrename(nextTitle);
		draft = null;
		if (element) renderHighlighted(element, nextTitle || title);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') { event.preventDefault(); (event.currentTarget as HTMLElement).blur(); }
		else if (event.key === 'Escape') {
			event.preventDefault();
			draft = title;
			if (element) renderHighlighted(element, title);
			(event.currentTarget as HTMLElement).blur();
		}
	}

	$effect(() => {
		const nextTitle = title;
		if (element && document.activeElement !== element) renderHighlighted(element, nextTitle);
	});
</script>

<div bind:this={element} class:completed class="editable-title task-title rounded-md text-sm font-bold" contenteditable="plaintext-only" role="textbox" tabindex="0" aria-label={label} spellcheck="true" onfocus={() => (draft = element?.textContent ?? title)} oninput={(event) => !(event as unknown as InputEvent).isComposing && update(event.currentTarget as HTMLElement)} oncompositionend={(event) => update(event.currentTarget as HTMLElement)} onblur={commit} onkeydown={handleKeydown}></div>

<style>
	.task-title { overflow-wrap: anywhere; white-space: normal; line-height: 1.3; color: var(--color-ink); }
	.completed { color: var(--color-ink-muted); text-decoration: line-through; }
	.editable-title :global(.task-hashtag) { border-radius: 0.35rem; background: color-mix(in srgb, var(--color-sprout) 34%, transparent); color: var(--color-moss); padding: 0 0.16rem; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
	.editable-title { cursor: text; padding: 0.15rem 0.2rem; margin: -0.15rem -0.2rem; }
	.editable-title:hover { background: color-mix(in srgb, var(--color-mist) 60%, transparent); }
	.editable-title:focus { background: var(--color-paper); box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-moss) 34%, transparent); outline: none; }
</style>
