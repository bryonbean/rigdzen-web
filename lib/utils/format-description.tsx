import React from "react";

/**
 * Formats a description string with:
 * - Line breaks converted to paragraphs
 * - Lines starting with asterisks converted to bullet points
 */
export function formatDescription(
  description: string | null | undefined
): React.ReactNode {
  if (!description) return null;

  // Split by line breaks
  const lines = description.split(/\r?\n/).filter((line) => line.trim());

  const elements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];
  let bulletListItems: string[] = [];
  let listKey = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if line is a bullet point (starts with asterisk)
    const isBullet = /^\*\s+/.test(line);

    if (isBullet) {
      // If we were in a paragraph, close it
      if (currentParagraph.length > 0) {
        elements.push(
          <p key={`p-${i}`} className="text-sm text-muted-foreground mb-2">
            {currentParagraph.join(" ")}
          </p>
        );
        currentParagraph = [];
      }

      // Add to bullet list
      const bulletText = line.replace(/^\*\s+/, "");
      bulletListItems.push(bulletText);
    } else {
      // Regular text line - close bullet list if open
      if (bulletListItems.length > 0) {
        elements.push(
          <ul
            key={`ul-${listKey++}`}
            className="list-disc list-inside text-sm text-muted-foreground mb-2 space-y-1 ml-4"
          >
            {bulletListItems.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        );
        bulletListItems = [];
      }

      if (line) {
        currentParagraph.push(line);
      } else if (currentParagraph.length > 0) {
        // Empty line after paragraph - start new paragraph
        elements.push(
          <p key={`p-${i}`} className="text-sm text-muted-foreground mb-2">
            {currentParagraph.join(" ")}
          </p>
        );
        currentParagraph = [];
      }
    }
  }

  // Close any open elements
  if (currentParagraph.length > 0) {
    elements.push(
      <p key="p-final" className="text-sm text-muted-foreground mb-2">
        {currentParagraph.join(" ")}
      </p>
    );
  }

  if (bulletListItems.length > 0) {
    elements.push(
      <ul
        key={`ul-${listKey}`}
        className="list-disc list-inside text-sm text-muted-foreground mb-2 space-y-1 ml-4"
      >
        {bulletListItems.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    );
  }

  return <>{elements}</>;
}
