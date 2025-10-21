// Add copy buttons to code blocks
(function() {
  'use strict';

  if (!document.queryCommandSupported('copy') && !navigator.clipboard) {
    return;
  }

  function flashCopyMessage(el, msg) {
    el.textContent = msg;
    setTimeout(function() {
      el.textContent = "Copy";
    }, 1000);
  }

  function selectText(node) {
    var selection = window.getSelection();
    var range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
    return selection;
  }

  function addCopyButton(containerEl) {
    var copyBtn = document.createElement("button");
    copyBtn.className = "code-copy-btn";
    copyBtn.textContent = "Copy";

    var codeEl = containerEl.firstElementChild;
    copyBtn.addEventListener('click', function() {
      try {
        var selection = selectText(codeEl);
        var text = selection.toString();

        if (navigator.clipboard) {
          navigator.clipboard.writeText(text).then(function() {
            flashCopyMessage(copyBtn, 'Copied!');
          }, function(error) {
            console.error(error);
            flashCopyMessage(copyBtn, 'Failed');
          });
        } else {
          document.execCommand('copy');
          flashCopyMessage(copyBtn, 'Copied!');
        }

        selection.removeAllRanges();
      } catch (e) {
        console.error(e);
        flashCopyMessage(copyBtn, 'Failed');
      }
    });

    containerEl.appendChild(copyBtn);
  }

  // Add copy button to code blocks
  var highlightBlocks = document.querySelectorAll('.highlight');
  Array.prototype.forEach.call(highlightBlocks, addCopyButton);

  // Also add to plain pre blocks
  var preBlocks = document.querySelectorAll('pre:not(.highlight pre)');
  Array.prototype.forEach.call(preBlocks, function(preBlock) {
    if (preBlock.parentNode.classList && preBlock.parentNode.classList.contains('highlight')) {
      return;
    }
    var wrapper = document.createElement('div');
    wrapper.className = 'highlight';
    preBlock.parentNode.insertBefore(wrapper, preBlock);
    wrapper.appendChild(preBlock);
    addCopyButton(wrapper);
  });
})();
