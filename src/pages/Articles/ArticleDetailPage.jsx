// src/pages/Articles/ArticleDetailPage.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Header,
  Image,
  Icon,
  Button,
  Loader,
} from "semantic-ui-react";
import styles from "./ArticleDetailPage.module.css";
import { useArticle } from "../../hooks/useArticle";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark as prismOneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function ArticleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: article, isLoading } = useArticle(id);

  if (isLoading) {
    return <Loader active inline="centered" />;
  }

  if (!article) {
    return (
      <div className={styles.wrapper}>
        <Button
          labelPosition="left"
          className={styles.backBtn}
          onClick={() => navigate(-1)}
        >
          <Icon name="arrow left" /> Back
        </Button>
        <p>Article not found.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Button
        labelPosition="left"
        className={styles.backBtn}
        onClick={() => navigate(-1)}
      >
        <Icon name="arrow left" /> Back
      </Button>

      <Header as="h1" className={styles.title}>
        {article.title}
      </Header>

      {article.imageUrl && (
        <Image
          src={article.imageUrl}
          className={styles.image}
          loading="lazy"
          decoding="async"
        />
      )}

      {article.abstract && (
        <p className={styles.abstract}>{article.abstract}</p>
      )}

      <div className={styles.body}>
        <div className={styles.markdown}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ inline, className, children, node, ...rest }) {
                const match = /language-(\w+)/.exec(className || "");
                const language = match ? match[1] : undefined;

                if (inline) {
                  return (
                    <code {...rest}>
                      {children}
                    </code>
                  );
                }

                return (
                  <SyntaxHighlighter
                    style={prismOneDark}
                    language={language}
                    PreTag="div"
                    showLineNumbers
                    wrapLongLines
                    {...rest}
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                );
              },
            }}
          >
            {article.body || ""}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
