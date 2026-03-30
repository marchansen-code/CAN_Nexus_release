import {
  List,
  ActionPanel,
  Action,
  Detail,
  Icon,
  Color,
  getPreferenceValues,
  showToast,
  Toast,
} from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState } from "react";

// ─── Types ───────────────────────────────────────────

interface Preferences {
  apiBaseUrl: string;
}

interface Article {
  article_id: string;
  title: string;
  snippet: string;
  breadcrumb: string;
  tags: string[];
  updated_at: string;
  score: number;
  type: "article";
}

interface Document {
  document_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  created_at: string;
  type: "document";
}

interface SearchResponse {
  articles: Article[];
  documents: Document[];
  query: string;
}

interface ArticleDetail {
  article_id: string;
  title: string;
  content: string;
  tags: string[];
  breadcrumb: string;
  author: string;
  updated_at: string;
}

// ─── Helpers ─────────────────────────────────────────

function getApiBase(): string {
  const prefs = getPreferenceValues<Preferences>();
  return prefs.apiBaseUrl.replace(/\/+$/, "");
}

function formatFileSize(bytes: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToMarkdown(html: string): string {
  let md = html;
  // Headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n# $1\n");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n");
  md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "\n#### $1\n");
  // Bold & italic
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
  // Code
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
  md = md.replace(/<kbd[^>]*>(.*?)<\/kbd>/gi, "`$1`");
  // Links
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");
  // Lists
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
  md = md.replace(/<\/?[ou]l[^>]*>/gi, "\n");
  // Blockquotes
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, "\n> $1\n");
  // Paragraphs & breaks
  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<\/p>/gi, "\n\n");
  md = md.replace(/<p[^>]*>/gi, "");
  // Horizontal rules
  md = md.replace(/<hr[^>]*>/gi, "\n---\n");
  // Tables (basic)
  md = md.replace(/<\/tr>/gi, "|\n");
  md = md.replace(/<t[hd][^>]*>/gi, "| ");
  md = md.replace(/<\/t[hd]>/gi, " ");
  md = md.replace(/<\/?thead[^>]*>/gi, "");
  md = md.replace(/<\/?tbody[^>]*>/gi, "");
  md = md.replace(/<\/?table[^>]*>/gi, "\n");
  // Strip remaining tags
  md = md.replace(/<[^>]+>/g, "");
  // Decode entities
  md = md.replace(/&nbsp;/g, " ");
  md = md.replace(/&amp;/g, "&");
  md = md.replace(/&lt;/g, "<");
  md = md.replace(/&gt;/g, ">");
  md = md.replace(/&quot;/g, '"');
  // Clean up whitespace
  md = md.replace(/\n{3,}/g, "\n\n");
  return md.trim();
}

function fileTypeIcon(fileType: string): { source: Icon; tintColor: Color } {
  switch (fileType) {
    case ".pdf":
      return { source: Icon.Document, tintColor: Color.Red };
    case ".docx":
    case ".doc":
      return { source: Icon.Document, tintColor: Color.Blue };
    case ".xlsx":
    case ".xls":
    case ".csv":
      return { source: Icon.List, tintColor: Color.Green };
    case ".txt":
      return { source: Icon.Text, tintColor: Color.SecondaryText };
    default:
      return { source: Icon.Document, tintColor: Color.SecondaryText };
  }
}

// ─── Article Detail View ─────────────────────────────

function ArticleDetailView({ articleId }: { articleId: string }) {
  const apiBase = getApiBase();
  const { data, isLoading, error } = useFetch<ArticleDetail>(
    `${apiBase}/api/widget/article/${articleId}`
  );

  if (error) {
    showToast(Toast.Style.Failure, "Fehler beim Laden", error.message);
  }

  const markdown = data
    ? `# ${data.title}\n\n${data.breadcrumb ? `> ${data.breadcrumb}\n\n` : ""}${htmlToMarkdown(data.content)}`
    : "Lade Artikel...";

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      metadata={
        data ? (
          <Detail.Metadata>
            {data.author && <Detail.Metadata.Label title="Autor" text={data.author} />}
            {data.updated_at && (
              <Detail.Metadata.Label title="Aktualisiert" text={formatDate(data.updated_at)} />
            )}
            {data.breadcrumb && (
              <Detail.Metadata.Label title="Kategorie" text={data.breadcrumb} />
            )}
            {data.tags && data.tags.length > 0 && (
              <Detail.Metadata.TagList title="Tags">
                {data.tags.map((tag) => (
                  <Detail.Metadata.TagList.Item key={tag} text={tag} color={Color.Purple} />
                ))}
              </Detail.Metadata.TagList>
            )}
          </Detail.Metadata>
        ) : undefined
      }
      actions={
        <ActionPanel>
          <Action.OpenInBrowser
            title="Im Browser öffnen"
            url={`${apiBase}/articles/${articleId}`}
          />
          {data && <Action.CopyToClipboard title="Titel kopieren" content={data.title} />}
        </ActionPanel>
      }
    />
  );
}

// ─── Main Search Command ─────────────────────────────

export default function SearchNexus() {
  const [query, setQuery] = useState("");
  const apiBase = getApiBase();

  const { data, isLoading, error } = useFetch<SearchResponse>(
    `${apiBase}/api/widget/search?q=${encodeURIComponent(query)}&limit=20`,
    { execute: query.length >= 2, keepPreviousData: true }
  );

  if (error && query.length >= 2) {
    showToast(Toast.Style.Failure, "Suche fehlgeschlagen", error.message);
  }

  const articles = data?.articles ?? [];
  const documents = data?.documents ?? [];
  const hasResults = articles.length > 0 || documents.length > 0;

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setQuery}
      searchBarPlaceholder="CANUSA Nexus durchsuchen..."
      throttle
    >
      {query.length < 2 ? (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="Suchbegriff eingeben"
          description="Mindestens 2 Zeichen eingeben, um Artikel und Dokumente zu finden."
        />
      ) : !isLoading && !hasResults ? (
        <List.EmptyView
          icon={Icon.XMarkCircle}
          title="Keine Ergebnisse"
          description={`Keine Treffer für „${query}"`}
        />
      ) : (
        <>
          {articles.length > 0 && (
            <List.Section title="Artikel" subtitle={`${articles.length} Treffer`}>
              {articles.map((article) => (
                <List.Item
                  key={article.article_id}
                  icon={{ source: Icon.Book, tintColor: Color.Purple }}
                  title={article.title}
                  subtitle={article.snippet?.substring(0, 80)}
                  accessories={[
                    ...(article.breadcrumb
                      ? [{ tag: { value: article.breadcrumb, color: Color.Blue } }]
                      : []),
                    ...(article.updated_at ? [{ text: formatDate(article.updated_at) }] : []),
                  ]}
                  actions={
                    <ActionPanel>
                      <Action.Push
                        title="Artikel anzeigen"
                        icon={Icon.Eye}
                        target={<ArticleDetailView articleId={article.article_id} />}
                      />
                      <Action.OpenInBrowser
                        title="Im Browser öffnen"
                        url={`${apiBase}/articles/${article.article_id}`}
                      />
                      <Action.CopyToClipboard title="Titel kopieren" content={article.title} />
                    </ActionPanel>
                  }
                />
              ))}
            </List.Section>
          )}

          {documents.length > 0 && (
            <List.Section title="Dokumente" subtitle={`${documents.length} Treffer`}>
              {documents.map((doc) => (
                <List.Item
                  key={doc.document_id}
                  icon={fileTypeIcon(doc.file_type)}
                  title={doc.filename}
                  subtitle={doc.file_type?.toUpperCase().replace(".", "")}
                  accessories={[
                    ...(doc.file_size ? [{ text: formatFileSize(doc.file_size) }] : []),
                    ...(doc.created_at ? [{ text: formatDate(doc.created_at) }] : []),
                  ]}
                  actions={
                    <ActionPanel>
                      <Action.OpenInBrowser
                        title="Dokument herunterladen"
                        url={`${apiBase}/api/widget/document/${doc.document_id}/file`}
                      />
                      <Action.CopyToClipboard
                        title="Dateiname kopieren"
                        content={doc.filename}
                      />
                    </ActionPanel>
                  }
                />
              ))}
            </List.Section>
          )}
        </>
      )}
    </List>
  );
}
