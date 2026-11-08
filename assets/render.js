/*
 * Shared rendering + measurement for the demo.
 * Plain browser script (no modules) so index.html also works from file://.
 * scripts/verify.mjs loads it through `new Function` and tests the same code
 * the page runs, so the checks cover real output rather than a copy.
 */
(function (root) {
  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function inline(text) {
    return esc(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noreferrer">$1</a>');
  }

  function isOrdered(block) {
    return block
      .split('\n')
      .filter(function (l) { return l.trim(); })
      .every(function (l) { return /^\d+\.\s+/.test(l); });
  }

  function isUnordered(block) {
    return block
      .split('\n')
      .filter(function (l) { return l.trim(); })
      .every(function (l) { return /^-\s+/.test(l); });
  }

  function codeBlock(block) {
    var m = block.match(/^```([^\n]*)\n([\s\S]*?)\n?```$/);
    if (!m) return null;
    return { lang: m[1].trim(), body: m[2] };
  }

  function blocksToHtml(blocks) {
    return (blocks || [])
      .map(function (raw) {
        var block = String(raw).trim();
        if (!block) return '';

        var code = codeBlock(block);
        if (code) {
          return '<pre><code' + (code.lang ? ' data-lang="' + esc(code.lang) + '"' : '') + '>' +
            esc(code.body) + '</code></pre>';
        }
        if (isOrdered(block)) {
          var items = block.split('\n').filter(Boolean).map(function (l) {
            return '<li>' + inline(l.replace(/^\d+\.\s+/, '')) + '</li>';
          });
          return '<ol>' + items.join('') + '</ol>';
        }
        if (isUnordered(block)) {
          var lis = block.split('\n').filter(Boolean).map(function (l) {
            return '<li>' + inline(l.replace(/^-\s+/, '')) + '</li>';
          });
          return '<ul>' + lis.join('') + '</ul>';
        }
        return '<p>' + inline(block.replace(/\s*\n\s*/g, ' ')) + '</p>';
      })
      .join('\n');
  }

  function plain(blocks) {
    return (blocks || [])
      .map(function (raw) {
        return String(raw).replace(/```[^\n]*\n([\s\S]*?)```/g, '$1');
      })
      .join('\n')
      .replace(/[`*#>]/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  }

  function wordCount(blocks) {
    var text = plain(blocks).replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
  }

  function stepCount(blocks) {
    return (blocks || []).reduce(function (n, raw) {
      var block = String(raw).trim();
      if (!isOrdered(block)) return n;
      return n + block.split('\n').filter(Boolean).length;
    }, 0);
  }

  var FILLER = /^(great question|good question|sure[,!.]|certainly|of course|let me|thanks|thank you|happy to|i'?d be happy|both are excellent|pagination is a great|performance is a broad|lots of progress|i don'?t have direct access|this looks pretty good)/i;
  var CLOSER = /(hope (this|that) helps|let me know|happy to (dig|help|look|write)|feel free to|don'?t hesitate|clear as mud)/i;

  function firstSentence(blocks) {
    var text = plain([blocks[0] || '']).trim();
    var m = text.match(/^[^.!?]+[.!?]/);
    return (m ? m[0] : text).slice(0, 70);
  }

  function analyze(examples) {
    return examples.map(function (ex) {
      var b = wordCount(ex.before);
      var a = wordCount(ex.after);
      return {
        id: ex.id,
        beforeWords: b,
        afterWords: a,
        reduction: b ? Math.round((1 - a / b) * 100) : 0,
        beforeSteps: stepCount(ex.before),
        afterSteps: stepCount(ex.after),
        beforeOpener: firstSentence(ex.before),
        afterOpener: firstSentence(ex.after),
        beforeHasFiller: FILLER.test(plain([ex.before[0] || ''])),
        beforeHasCloser: CLOSER.test(plain(ex.before)),
        afterHasFiller: FILLER.test(plain([ex.after[0] || ''])),
        afterHasCloser: CLOSER.test(plain(ex.after))
      };
    });
  }

  root.Render = {
    esc: esc,
    inline: inline,
    blocksToHtml: blocksToHtml,
    plain: plain,
    wordCount: wordCount,
    stepCount: stepCount,
    analyze: analyze,
    FILLER: FILLER,
    CLOSER: CLOSER
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
