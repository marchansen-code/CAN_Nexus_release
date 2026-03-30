/**
 * CANUSA Nexus Search Widget
 * Embeddable search widget for external websites.
 *
 * Usage:
 *   <div id="canusa-search"></div>
 *   <script src="https://YOUR_DOMAIN/api/widget/embed.js" data-api="https://YOUR_DOMAIN"></script>
 */
(function () {
  "use strict";

  /* ───── Configuration ───── */
  const scriptTag = document.currentScript;
  const API_BASE = (scriptTag && scriptTag.getAttribute("data-api")) || "";
  if (!API_BASE) {
    console.error("[CANUSA Widget] Missing data-api attribute on script tag.");
    return;
  }

  const CONTAINER_ID = (scriptTag && scriptTag.getAttribute("data-container")) || "canusa-search";
  const DEBOUNCE_MS = 300;

  /* ───── Styles (scoped via prefix) ───── */
  const STYLE = `
    .cnx-widget { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif; max-width: 720px; margin: 0 auto; color: #1a1a2e; }
    .cnx-widget *, .cnx-widget *::before, .cnx-widget *::after { box-sizing: border-box; }
    .cnx-search-box { position: relative; }
    .cnx-search-input { width: 100%; padding: 12px 16px 12px 42px; font-size: 15px; border: 1.5px solid #d1d5db; border-radius: 10px; outline: none; background: #fff; transition: border-color .2s, box-shadow .2s; }
    .cnx-search-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,.12); }
    .cnx-search-input::placeholder { color: #9ca3af; }
    .cnx-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #9ca3af; }
    .cnx-spinner { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; border: 2px solid #e5e7eb; border-top-color: #6366f1; border-radius: 50%; animation: cnx-spin .6s linear infinite; }
    @keyframes cnx-spin { to { transform: translateY(-50%) rotate(360deg); } }
    .cnx-results { margin-top: 12px; }
    .cnx-empty { text-align: center; padding: 32px 16px; color: #6b7280; font-size: 14px; }
    .cnx-section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: #6b7280; padding: 8px 4px 4px; }
    .cnx-card { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; margin: 4px 0; border-radius: 8px; cursor: pointer; transition: background .15s; border: 1px solid transparent; }
    .cnx-card:hover { background: #f3f4f6; border-color: #e5e7eb; }
    .cnx-card-icon { flex-shrink: 0; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #fff; }
    .cnx-card-icon--article { background: #6366f1; }
    .cnx-card-icon--document { background: #0891b2; }
    .cnx-card-body { flex: 1; min-width: 0; }
    .cnx-card-title { font-size: 14px; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cnx-card-snippet { font-size: 13px; color: #4b5563; margin-top: 2px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .cnx-card-meta { font-size: 11px; color: #9ca3af; margin-top: 4px; display: flex; gap: 8px; flex-wrap: wrap; }
    .cnx-tag { display: inline-block; font-size: 10px; padding: 1px 6px; border-radius: 4px; background: #e0e7ff; color: #4338ca; }

    /* ── Popup overlay ── */
    .cnx-overlay { position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; padding: 24px; backdrop-filter: blur(2px); animation: cnx-fade-in .2s ease; }
    @keyframes cnx-fade-in { from { opacity: 0; } to { opacity: 1; } }
    .cnx-popup { background: #fff; border-radius: 12px; width: 100%; max-width: 800px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,.25); animation: cnx-slide-up .25s ease; }
    @keyframes cnx-slide-up { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .cnx-popup-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
    .cnx-popup-title { font-size: 17px; font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-right: 12px; }
    .cnx-popup-close { width: 32px; height: 32px; border: none; background: #f3f4f6; border-radius: 8px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6b7280; transition: background .15s; flex-shrink: 0; }
    .cnx-popup-close:hover { background: #e5e7eb; color: #111827; }
    .cnx-popup-meta { padding: 10px 24px 0; font-size: 12px; color: #6b7280; display: flex; gap: 16px; flex-wrap: wrap; }
    .cnx-popup-breadcrumb { font-size: 12px; color: #6366f1; }

    /* ── Article content body ── */
    .cnx-popup-body { overflow-y: auto; padding: 28px 32px 36px; flex: 1; font-size: 15px; line-height: 1.75; color: #1f2937; }
    .cnx-popup-body h1 { font-size: 1.65em; font-weight: 800; color: #111827; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; line-height: 1.3; }
    .cnx-popup-body h2 { font-size: 1.35em; font-weight: 700; color: #111827; margin: 28px 0 12px; line-height: 1.35; }
    .cnx-popup-body h3 { font-size: 1.15em; font-weight: 600; color: #1f2937; margin: 24px 0 10px; line-height: 1.4; }
    .cnx-popup-body h4 { font-size: 1em; font-weight: 600; color: #374151; margin: 20px 0 8px; }
    .cnx-popup-body p { margin: 0 0 16px; }
    .cnx-popup-body img { max-width: 100%; height: auto; border-radius: 6px; margin: 8px 0; }
    .cnx-popup-body a { color: #4f46e5; text-decoration: underline; text-underline-offset: 2px; }
    .cnx-popup-body a:hover { color: #3730a3; }
    .cnx-popup-body strong { font-weight: 700; color: #111827; }
    .cnx-popup-body ul, .cnx-popup-body ol { margin: 0 0 16px; padding-left: 24px; }
    .cnx-popup-body li { margin-bottom: 6px; }
    .cnx-popup-body li::marker { color: #6b7280; }

    /* Tables */
    .cnx-popup-body table { border-collapse: collapse; width: 100%; margin: 16px 0 20px; font-size: 14px; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; }
    .cnx-popup-body thead th, .cnx-popup-body th { background: #f1f5f9; font-weight: 600; color: #334155; text-align: left; padding: 10px 14px; border: 1px solid #d1d5db; font-size: 13px; }
    .cnx-popup-body td { padding: 10px 14px; border: 1px solid #e5e7eb; color: #374151; vertical-align: top; }
    .cnx-popup-body tbody tr:nth-child(even) { background: #f9fafb; }
    .cnx-popup-body tbody tr:hover { background: #f1f5f9; }

    /* Blockquotes & info boxes */
    .cnx-popup-body blockquote { margin: 16px 0 20px; padding: 14px 18px; border-left: 4px solid #6366f1; background: #eef2ff; border-radius: 0 8px 8px 0; color: #3730a3; font-size: 14px; }
    .cnx-popup-body blockquote p { margin-bottom: 4px; }
    .cnx-popup-body div[style*="background"] { border-radius: 8px; padding: 14px 18px !important; margin: 16px 0 !important; font-size: 14px; }

    /* Code & kbd */
    .cnx-popup-body code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.88em; font-family: 'SF Mono', Monaco, Consolas, monospace; color: #e11d48; }
    .cnx-popup-body pre { background: #1e293b; color: #e2e8f0; padding: 16px 20px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.6; margin: 16px 0; }
    .cnx-popup-body pre code { background: none; color: inherit; padding: 0; font-size: inherit; }
    .cnx-popup-body kbd { display: inline-block; padding: 2px 7px; font-size: 0.85em; font-family: 'SF Mono', Monaco, Consolas, monospace; color: #374151; background: #f9fafb; border: 1px solid #d1d5db; border-radius: 4px; box-shadow: 0 1px 0 #d1d5db; }

    /* Horizontal rules */
    .cnx-popup-body hr { border: none; height: 1px; background: #e5e7eb; margin: 24px 0; }

    /* Document viewer (fallback for PDFs without file) */
    .cnx-doc-viewer { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px 40px; max-height: 65vh; overflow-y: auto; font-size: 14px; line-height: 1.8; color: #1f2937; box-shadow: inset 0 1px 3px rgba(0,0,0,.04); }
    .cnx-doc-viewer p { margin: 0 0 12px; }
    .cnx-doc-viewer table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    .cnx-doc-viewer td, .cnx-doc-viewer th { border: 1px solid #d1d5db; padding: 8px 12px; font-size: 13px; }
    .cnx-doc-viewer h1, .cnx-doc-viewer h2, .cnx-doc-viewer h3 { font-weight: 700; margin: 16px 0 8px; color: #111827; }
    .cnx-doc-viewer img { max-width: 100%; }
    .cnx-doc-text { white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #374151; }
    .cnx-highlight { background: #fef08a; padding: 0 2px; border-radius: 2px; }
  `;

  /* ───── SVG Icons ───── */
  const ICON_SEARCH = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
  const ICON_ARTICLE = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>';
  const ICON_DOC = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>';

  /* ───── Utility ───── */
  function debounce(fn, ms) {
    let t;
    return function () {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, arguments), ms);
    };
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function formatFileSize(bytes) {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  function highlightTerms(text, terms) {
    if (!text || !terms || !terms.length) return escapeHtml(text);
    let safe = escapeHtml(text);
    terms.forEach(function (t) {
      const re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
      safe = safe.replace(re, '<span class="cnx-highlight">$1</span>');
    });
    return safe;
  }

  /* ───── API ───── */
  async function apiGet(path) {
    const res = await fetch(API_BASE + "/api/widget" + path, {
      mode: "cors",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("API " + res.status);
    return res.json();
  }

  /* ───── Popup ───── */
  function openPopup(title, bodyHtml, metaHtml) {
    closePopup();
    const overlay = document.createElement("div");
    overlay.className = "cnx-overlay";
    overlay.setAttribute("data-cnx-popup", "1");
    overlay.innerHTML =
      '<div class="cnx-popup">' +
        '<div class="cnx-popup-header">' +
          '<span class="cnx-popup-title">' + escapeHtml(title) + "</span>" +
          '<button class="cnx-popup-close" aria-label="Schließen">&times;</button>' +
        "</div>" +
        (metaHtml ? '<div class="cnx-popup-meta">' + metaHtml + "</div>" : "") +
        '<div class="cnx-popup-body">' + bodyHtml + "</div>" +
      "</div>";

    overlay.querySelector(".cnx-popup-close").addEventListener("click", closePopup);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closePopup();
    });
    document.body.appendChild(overlay);
    document.addEventListener("keydown", onEsc);
  }

  function closePopup() {
    var el = document.querySelector("[data-cnx-popup]");
    if (el) el.remove();
    document.removeEventListener("keydown", onEsc);
  }

  function onEsc(e) {
    if (e.key === "Escape") closePopup();
  }

  /* ───── Open article popup ───── */
  async function openArticle(articleId, searchTerms) {
    openPopup("Lade...", '<div style="text-align:center;padding:40px;color:#9ca3af;">Lade Artikel...</div>', "");
    try {
      const data = await apiGet("/article/" + articleId);
      let content = data.content || "<p>Kein Inhalt</p>";
      // Highlight search terms in content
      if (searchTerms && searchTerms.length) {
        searchTerms.forEach(function (t) {
          const re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
          content = content.replace(re, '<span class="cnx-highlight">$1</span>');
        });
      }
      var meta = "";
      if (data.breadcrumb) meta += '<span class="cnx-popup-breadcrumb">' + escapeHtml(data.breadcrumb) + "</span>";
      if (data.author) meta += "<span>Von " + escapeHtml(data.author) + "</span>";
      if (data.updated_at) meta += "<span>" + new Date(data.updated_at).toLocaleDateString("de-DE") + "</span>";
      openPopup(data.title, content, meta);
    } catch (err) {
      openPopup("Fehler", '<div style="text-align:center;padding:40px;color:#ef4444;">Artikel konnte nicht geladen werden.</div>', "");
    }
  }

  /* ───── Open document popup ───── */
  async function openDocument(documentId, filename, searchTerms) {
    openPopup("Lade...", '<div style="text-align:center;padding:40px;color:#9ca3af;">Lade Dokument...</div>', "");
    try {
      const data = await apiGet("/document/" + documentId + "/preview");
      var body = "";

      // File types that can be rendered natively in an iframe
      var iframeTypes = [".pdf", ".txt", ".csv"];
      var canIframe = data.has_file && iframeTypes.indexOf(data.file_type) !== -1;

      if (canIframe) {
        // Render the actual file in an iframe/object (PDF viewer, text, etc.)
        var fileUrl = API_BASE + "/api/widget/document/" + documentId + "/file";
        if (data.file_type === ".pdf") {
          body =
            '<object data="' + fileUrl + '" type="application/pdf" style="width:100%;height:65vh;border:none;">' +
              '<iframe src="' + fileUrl + '" style="width:100%;height:65vh;border:none;"></iframe>' +
            '</object>' +
            '<div style="text-align:center;margin-top:8px;">' +
              '<a href="' + fileUrl + '" target="_blank" rel="noopener noreferrer" style="color:#6366f1;font-size:13px;">PDF in neuem Tab öffnen</a>' +
            '</div>';
        } else {
          body = '<iframe src="' + fileUrl + '" style="width:100%;height:65vh;border:none;border-radius:4px;"></iframe>';
        }
      } else if (data.html_content) {
        var htmlContent = data.html_content;
        if (searchTerms && searchTerms.length) {
          searchTerms.forEach(function (t) {
            const re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
            htmlContent = htmlContent.replace(re, '<span class="cnx-highlight">$1</span>');
          });
        }
        body = '<div class="cnx-doc-viewer">' + htmlContent + '</div>';
      } else if (data.extracted_text) {
        body = '<pre class="cnx-doc-text">' + highlightTerms(data.extracted_text, searchTerms) + "</pre>";
      } else {
        body = '<div style="text-align:center;padding:40px;color:#6b7280;">Keine Vorschau verfügbar.</div>';
      }
      var meta = "";
      if (data.file_type) meta += "<span>" + escapeHtml(data.file_type.toUpperCase()) + "</span>";
      if (data.file_size) meta += "<span>" + formatFileSize(data.file_size) + "</span>";
      openPopup(data.filename || filename, body, meta);
    } catch (err) {
      openPopup("Fehler", '<div style="text-align:center;padding:40px;color:#ef4444;">Dokument konnte nicht geladen werden.</div>', "");
    }
  }

  /* ───── Render search results ───── */
  function renderResults(data, searchTerms) {
    var html = "";
    var hasArticles = data.articles && data.articles.length > 0;
    var hasDocs = data.documents && data.documents.length > 0;

    if (!hasArticles && !hasDocs) {
      return '<div class="cnx-empty">Keine Ergebnisse gefunden</div>';
    }

    if (hasArticles) {
      html += '<div class="cnx-section-title">Artikel</div>';
      data.articles.forEach(function (a) {
        var tags = "";
        if (a.tags && a.tags.length) {
          tags = a.tags.slice(0, 3).map(function (t) { return '<span class="cnx-tag">' + escapeHtml(t) + "</span>"; }).join(" ");
        }
        html +=
          '<div class="cnx-card" data-type="article" data-id="' + a.article_id + '">' +
            '<div class="cnx-card-icon cnx-card-icon--article">' + ICON_ARTICLE + "</div>" +
            '<div class="cnx-card-body">' +
              '<div class="cnx-card-title">' + highlightTerms(a.title, searchTerms) + "</div>" +
              '<div class="cnx-card-snippet">' + highlightTerms(a.snippet, searchTerms) + "</div>" +
              '<div class="cnx-card-meta">' +
                (a.breadcrumb ? "<span>" + escapeHtml(a.breadcrumb) + "</span>" : "") +
                (tags ? "<span>" + tags + "</span>" : "") +
              "</div>" +
            "</div>" +
          "</div>";
      });
    }

    if (hasDocs) {
      html += '<div class="cnx-section-title">Dokumente</div>';
      data.documents.forEach(function (d) {
        var size = formatFileSize(d.file_size);
        html +=
          '<div class="cnx-card" data-type="document" data-id="' + d.document_id + '" data-filename="' + escapeHtml(d.filename) + '">' +
            '<div class="cnx-card-icon cnx-card-icon--document">' + ICON_DOC + "</div>" +
            '<div class="cnx-card-body">' +
              '<div class="cnx-card-title">' + highlightTerms(d.filename, searchTerms) + "</div>" +
              '<div class="cnx-card-meta">' +
                (d.file_type ? "<span>" + escapeHtml(d.file_type.toUpperCase()) + "</span>" : "") +
                (size ? "<span>" + size + "</span>" : "") +
              "</div>" +
            "</div>" +
          "</div>";
      });
    }

    return html;
  }

  /* ───── Init ───── */
  function init() {
    var container = document.getElementById(CONTAINER_ID);
    if (!container) {
      console.error("[CANUSA Widget] Container #" + CONTAINER_ID + " not found.");
      return;
    }

    // Inject styles
    var style = document.createElement("style");
    style.textContent = STYLE;
    document.head.appendChild(style);

    // Build widget
    container.innerHTML =
      '<div class="cnx-widget">' +
        '<div class="cnx-search-box">' +
          '<span class="cnx-search-icon">' + ICON_SEARCH + "</span>" +
          '<input class="cnx-search-input" type="text" placeholder="Suche in der Wissensdatenbank..." autocomplete="off" data-testid="widget-search-input" />' +
          '<div class="cnx-spinner" style="display:none;"></div>' +
        "</div>" +
        '<div class="cnx-results" data-testid="widget-search-results"></div>' +
      "</div>";

    var input = container.querySelector(".cnx-search-input");
    var spinner = container.querySelector(".cnx-spinner");
    var resultsEl = container.querySelector(".cnx-results");
    var currentTerms = [];

    async function doSearch() {
      var q = input.value.trim();
      if (q.length < 2) {
        resultsEl.innerHTML = "";
        return;
      }
      spinner.style.display = "block";
      currentTerms = q.toLowerCase().split(/\s+/);
      try {
        var data = await apiGet("/search?q=" + encodeURIComponent(q) + "&limit=15");
        resultsEl.innerHTML = renderResults(data, currentTerms);
      } catch (err) {
        resultsEl.innerHTML = '<div class="cnx-empty">Fehler bei der Suche</div>';
      }
      spinner.style.display = "none";
    }

    var debouncedSearch = debounce(doSearch, DEBOUNCE_MS);
    input.addEventListener("input", debouncedSearch);

    // Delegate click events
    resultsEl.addEventListener("click", function (e) {
      var card = e.target.closest(".cnx-card");
      if (!card) return;
      var type = card.getAttribute("data-type");
      var id = card.getAttribute("data-id");
      if (type === "article") {
        openArticle(id, currentTerms);
      } else if (type === "document") {
        var fname = card.getAttribute("data-filename");
        openDocument(id, fname, currentTerms);
      }
    });
  }

  // Run when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
