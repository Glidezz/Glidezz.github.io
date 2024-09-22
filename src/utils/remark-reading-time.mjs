import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

// https://docs.astro.build/en/recipes/reading-time/#recipe
export function remarkReadingTime() {
  return function (tree, { data }) {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    // readingTime.text will give us minutes read as a friendly string,
    // i.e. "3 min read"
    data.astro.frontmatter.minutesRead = readingTime.text;
  };
}
