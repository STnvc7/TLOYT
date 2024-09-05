import { FC } from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
    children: string;
}
export const MarkdownRenderer: FC<MarkdownRendererProps> =({ children })=> {
  return (
    <ReactMarkdown
      components={{
        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mb-3" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-lg font-medium mb-2" {...props} />,
        p: ({ node, ...props }) => <p className="mb-4" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc mb-4" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal mb-4" {...props} />,
        li: ({ node, ...props }) => <li className="mb-2" {...props} />,
        blockquote: ({ node, ...props }) => (
          <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4" {...props} />
        ),
        code: ({ node, className, children, ...props }) => (
          <code className="bg-gray-200 p-1 rounded" {...props}>
            {children}
          </code>
        ),
        a: ({ node, ...props }) => <a className="text-blue-500 underline" {...props} />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
