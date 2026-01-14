import { baseKeymap } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { history } from "prosemirror-history";
import {
  ellipsis,
  emDash,
  inputRules,
  smartQuotes,
  textblockTypeInputRule,
  wrappingInputRule,
} from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { DOMParser } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { useEffect, useRef } from "react";
import { cn } from "~/lib/utils";

function buildInputRules() {
  let rules = smartQuotes.concat(ellipsis, emDash);
  let type;
  if ((type = schema.nodes.blockquote))
    rules.push(wrappingInputRule(/^\s*>\s$/, type));
  if ((type = schema.nodes.code_block))
    rules.push(textblockTypeInputRule(/^```$/, type));
  if ((type = schema.nodes.heading))
    for (let i = 1; i <= 6; i++)
      rules.push(
        textblockTypeInputRule(
          new RegExp("^(#{1," + i + "})\\s$"),
          type,
          () => ({ level: i }),
        ),
      );
  return inputRules({ rules });
}

function markdownToDoc(markdown: string) {
  const div = document.createElement("div");

  const html = markdown
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/^\> (.*$)/gim, "<blockquote><p>$1</p></blockquote>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^(.*)$/gim, "<p>$1</p>");

  div.innerHTML = html;
  return DOMParser.fromSchema(schema).parse(div);
}

function docToMarkdown(doc: any): string {
  let markdown = "";

  doc.content.forEach((node: any) => {
    switch (node.type.name) {
      case "heading":
        markdown += "#".repeat(node.attrs.level) + " ";
        node.content?.forEach((child: any) => {
          if (child.type.name === "text") {
            markdown += child.text;
          }
        });
        markdown += "\n\n";
        break;
      case "paragraph":
        node.content?.forEach((child: any) => {
          if (child.type.name === "text") {
            let text = child.text;
            if (child.marks) {
              child.marks.forEach((mark: any) => {
                switch (mark.type.name) {
                  case "strong":
                    text = `**${text}**`;
                    break;
                  case "em":
                    text = `*${text}*`;
                    break;
                  case "code":
                    text = `\`${text}\``;
                    break;
                }
              });
            }
            markdown += text;
          }
        });
        markdown += "\n\n";
        break;
      case "blockquote":
        markdown += "> ";
        node.content?.forEach((child: any) => {
          if (child.type.name === "paragraph") {
            child.content?.forEach((grandchild: any) => {
              if (grandchild.type.name === "text") {
                markdown += grandchild.text;
              }
            });
          }
        });
        markdown += "\n\n";
        break;
      case "code_block":
        markdown += "```\n";
        node.content?.forEach((child: any) => {
          if (child.type.name === "text") {
            markdown += child.text;
          }
        });
        markdown += "\n```\n\n";
        break;
    }
  });

  return markdown.trim();
}

interface ProseMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ProseMirrorEditor({
  value,
  onChange,
  placeholder,
  className,
}: ProseMirrorEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (!editorRef.current) return;

    const doc = markdownToDoc(value || "");
    const state = EditorState.create({
      doc,
      plugins: [
        buildInputRules(),
        keymap(baseKeymap),
        history(),
        gapCursor(),
        dropCursor(),
      ],
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(transaction) {
        const newState = view.state.apply(transaction);
        view.updateState(newState);

        if (transaction.docChanged) {
          const markdown = docToMarkdown(newState.doc);
          lastValueRef.current = markdown;
          onChange(markdown);
        }
      },
      attributes: {
        class: cn(
          "prose prose-sm max-w-none focus:outline-none p-4 min-h-[200px]",
          "prose-headings:font-semibold prose-headings:text-foreground",
          "prose-p:text-foreground prose-p:leading-relaxed",
          "prose-strong:text-foreground prose-strong:font-semibold",
          "prose-em:text-foreground",
          "prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:rounded",
          "prose-pre:bg-muted prose-pre:text-foreground",
          "prose-blockquote:text-muted-foreground prose-blockquote:border-l-border",
          className,
        ),
      },
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (viewRef.current && value !== lastValueRef.current) {
      const doc = markdownToDoc(value || "");
      const newState = EditorState.create({
        doc,
        plugins: viewRef.current.state.plugins,
      });
      viewRef.current.updateState(newState);
      lastValueRef.current = value;
    }
  }, [value]);

  return (
    <div className={cn("border rounded-md bg-background relative", className)}>
      <div ref={editorRef} />
      {placeholder && !value && (
        <div className="absolute top-4 left-4 text-muted-foreground pointer-events-none">
          {placeholder}
        </div>
      )}
    </div>
  );
}
