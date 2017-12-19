(function () {

  'use strict';

  var self = {},
      flows = [],
      graphList = [];

  function daggit (canvas, rawGraphList, config) {

    if (!canvas.getContext) {
      return;
    }

    self.config = config || {};
    self.config.unitSize   = self.config.unitSize || 16;
    self.config.lineWidth  = self.config.lineWidth || 4;

    let defaultLightPalette = [ 'D29034', '4DC26B', '026AA7', 'A86CC1',
            '484553', '30364C', '000000', 'EB5A46', '933B27', 'B44772',
            '0079BF', '42548E', '49852E', 'CF513D', 'CD5A91', 'C377E0',
            '61BD4F', 'E99E40', 'E6C60D', '4CAF54', 'FFAB4A', '00AECC',
            'F2D600', '51E898', '3A476F', '222222', '094C72', 'A0711C',
            '6E2F1A', '3E4D80', '00C2E0', 'BB8129', 'FF80CE', '6C547B',
            'CCA42B', 'D9B51C', '0C3953', '3F6F21', '519839', '333333',
            '5AAC44', '0082A0', '055A8C', '4A9839', '006988', '36405F',
            '676D70', 'E76EB1', 'BD903C', '96304C', '0098B7', '4FD683',
            '89609E', 'B04632' ],
        defaultDarkPalette = [ '298FCA', 'EC9488', 'D6DADC', '4FD683', 'E6C60D',
            'F5DD29', 'B3F1D0', 'FF95D6', 'CF513D', '0079BF', 'FDC788',
            'F2D600', 'DFC0EB', 'B7DDB0', 'E76EB1', '7BC86C', '3E4D80',
            'F3E260', '838FB5', '8FDFEB', '6170A1', 'B2B9D0', 'D5A6E6',
            '676D70', '5AAC44', '6DECA9', '90ECC1', 'EFB3AB', '838C91',
            'E2E4E6', '61BD4F', 'CD8DE5', '333333', 'FFAB4A', 'F5EA92',
            'FAC6E5', 'A86CC1', 'FFB968', '42548E', '29CCE5', '8BBDD9',
            '99D18F', '51E898', '00AECC', '5DD3E5', 'E99E40', '5BA4CF',
            '00C2E0', 'FF80CE', 'EF7564', 'FFB0E1', 'FAD8B0', 'C377E0',
            '026AA7', 'EB5A46' ];
    self.config.theme = self.config.theme || {};
    if (! self.config.theme.palette) {
      if ((self.config.theme.name || 'light') === 'light') {
        self.config.theme.palette = defaultLightPalette;

        self.config.theme.node = self.config.theme.node || {
          inner: 'FFFFFF',
          outer: '000000',
          shadow: 'rgba(250, 250, 250, 0.9)'
        };
      }
      else {
        self.config.theme.palette = defaultDarkPalette;

        self.config.theme.node = self.config.theme.node || {
          inner: '000000',
          outer: 'FFFFFF',
          shadow: 'rgba(200, 200, 200, 0.4)'
        };
      }
    }
    self.config.theme.node.radius = self.config.theme.node.radius || 5;

    let ctx = self.ctx = canvas.getContext('2d');

    let devicePixelRatio = window.devicePixelRatio || 1,
        backingStoreRatio = ctx.webkitBackingStorePixelRatio
          || ctx.mozBackingStorePixelRatio
          || ctx.msBackingStorePixelRatio
          || ctx.oBackingStorePixelRatio
          || ctx.backingStorePixelRatio
          || 1;

    self.ratio = devicePixelRatio / backingStoreRatio;

    let maxWidth = 0;

    for (let i = 0, len = rawGraphList.length; i < len; ++i) {
      let midStr = rawGraphList[i].replace(/^\s+|\s+$/g, '').replace(/\s\s+/g, ' ');

      maxWidth = Math.max(midStr.replace(/(_|\s)/g, '').length, maxWidth);

      let row = midStr.split('');

      graphList.unshift(row);
    }

    let w = maxWidth * self.config.unitSize,
        h = graphList.length * self.config.unitSize;

    canvas.width = w * self.ratio;
    canvas.height = h * self.ratio;

    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    self.canvas = canvas;

    ctx.lineWidth = self.config.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.scale(self.ratio, self.ratio);

    draw(self, graphList);
  }

  function genRandomStr () {
    let rnum = Math.floor(Math.random() * self.config.palette.length);
    return self.config.palette[rnum];
  }

  function findFlow (id) {
    let i = flows.length;

    while (i-- && flows[i].id !== id) {}

    return i;
  }

  function findColumn (symbol, row) {
    let i = row.length;

    while (i-- && row[i] !== symbol) {}

    return i;
  }

  function findBranchOut (row) {
    if (!row) {
      return -1
    }

    let i = row.length;

    while (i--
      && !(row[i - 1] && row[i] === '/' && row[i - 1] === '|')
      && !(row[i - 2] && row[i] === '_' && row[i - 2] === '|')) {}

    return i;
  }

  function genNewFlow () {
    let i = flows.length % self.config.theme.palette.length;
    let newId = self.config.theme.palette[i];

    return {id: newId, color: '#' + newId};
  }

  // draw method
  function drawLineRight (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x,                        y + self.config.unitSize / 2);
    ctx.lineTo(x + self.config.unitSize, y + self.config.unitSize / 2);
    ctx.stroke();
  }

  function drawLineUp (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + self.config.unitSize / 2);
    ctx.lineTo(x, y - self.config.unitSize / 2);
    ctx.stroke();
  }

  function drawNode (self, x, y, color, selected) {
    let ctx = self.ctx;
    ctx.strokeStyle = color;

    drawLineUp(self, x, y, color);

    let cnode = self.config.theme.node;
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = '#'+ cnode.outer;
    ctx.arc(x, y, cnode.radius, 0, Math.PI * 2);
    if (selected) {
      ctx.shadowOffsetX = cnode.radius / 2;
      ctx.shadowBlur = cnode.radius;
      ctx.shadowColor = cnode.shadow;
    }
    ctx.fill();
    if (! selected) {
      ctx.beginPath();
      ctx.fillStyle = '#'+ cnode.inner;
      ctx.arc(x, y, cnode.radius / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLineIn (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = color;

    ctx.beginPath();
    ctx.moveTo(x + self.config.unitSize, y + self.config.unitSize / 2);
    ctx.bezierCurveTo(
      x + self.config.unitSize, y,
      x,                        y,
      x,                        y - self.config.unitSize / 2
    );
    ctx.stroke();
  }

  function drawLineOut (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + self.config.unitSize / 2);
    ctx.bezierCurveTo(
      x,                        y,
      x + self.config.unitSize, y,
      x + self.config.unitSize, y - self.config.unitSize / 2
    );
    ctx.stroke();
  }

  function draw (self, graphList) {

    // initiate for first row
    for (let i = 0, len = graphList[0].length; i < len; ++i) {
      if (graphList[0][i] !== '_' && graphList[0][i] !== ' ') {
        flows.push(genNewFlow());
      }
    }

    let y = (self.canvas.height / self.ratio) - self.config.unitSize / 2;

    // iterate
    let prevRowLength = 0,
        condensePrevLength = 0,
        inlineIntersect = false;
    for (let i = 0, len = graphList.length; i < len; ++i) {
      let x = self.config.unitSize / 2,
          currentRow = graphList[i],
          nextRow = graphList[i + 1],
          prevRow = graphList[i - 1],
          flowSwapPos = -1;

      let condenseCurrentLength = currentRow.filter(function (val) {
        return (val !== ' ' && val !== '_')
      }).length;

      // pre process begin
      // use last row for analysing
      if (prevRow) {
        if (!inlineIntersect) {
          // intersect might happen
          for (let columnIndex = 0; columnIndex < prevRowLength; ++columnIndex) {
            if (prevRow[columnIndex + 1] && prevRow[columnIndex] === '/' && prevRow[columnIndex + 1] === '|'
                || prevRow[columnIndex] === '_' && prevRow[columnIndex + 1] === '|' && prevRow[columnIndex + 2] === '/') {
              flowSwapPos = columnIndex;

              // swap two flows
              let tempFlow = {id:flows[flowSwapPos].id, color:flows[flowSwapPos].color};

              flows[flowSwapPos].id = flows[flowSwapPos + 1].id;
              flows[flowSwapPos].color = flows[flowSwapPos + 1].color;

              flows[flowSwapPos + 1].id = tempFlow.id;
              flows[flowSwapPos + 1].color = tempFlow.color;
            }
          }
        }

        let nodePos;
        if (condensePrevLength < condenseCurrentLength
            && (nodePos = findColumn('*', currentRow)) !== -1
            && findColumn('_', currentRow) === -1) {
          flows.splice(nodePos - 1, 0, genNewFlow());
        }

        if (prevRowLength > currentRow.length
            && (nodePos = findColumn('*', prevRow)) !== -1) {

          if (findColumn('_', currentRow) === -1
              && findColumn('/', currentRow) === -1
              && findColumn('\\', currentRow) === -1) {
            flows.splice(nodePos + 1, 1);
          }
        }
      } // done with the previous row

      prevRowLength = currentRow.length;  // store for next round
      let condenseIndex = 0;
      condensePrevLength = 0;
      for (let columnIndex = 0; columnIndex < currentRow.length; ++columnIndex) {
        let column = currentRow[columnIndex];

        if (column !== ' ' && column !== '_') {
          ++condensePrevLength;
        }

        if (column === ' '
            && currentRow[columnIndex + 1]
            && currentRow[columnIndex + 1] === '_'
            && currentRow[columnIndex - 1]
            && currentRow[columnIndex - 1] === '|') {
          currentRow.splice(columnIndex, 1);

          currentRow[columnIndex] = '/';
          column = '/';
        }

        // create new flow only when no intersetc happened
        if (flowSwapPos === -1
            && column === '/'
            && currentRow[columnIndex - 1]
            && currentRow[columnIndex - 1] === '|') {
          flows.splice(condenseIndex, 0, genNewFlow());
        }

        // change \ and / to | when it's in the last position of the whole row
        if (column === '/' || column === '\\') {
          if (!(column === '/' && findBranchOut(nextRow) === -1)) {
            let lastLinePos;
            if ((lastLinePos = Math.max(findColumn('|', currentRow), findColumn('*', currentRow)) ) !== -1
                && lastLinePos < columnIndex - 1) {
              while (currentRow[++lastLinePos] === ' ') {}

              if (lastLinePos === columnIndex) {
                currentRow[columnIndex] = '|';
              }
            }
          }
        }

        if (column === '*'
            && prevRow
            && prevRow[condenseIndex + 1] === '\\') {
          flows.splice(condenseIndex + 1, 1);
        }

        if (column !== ' ') {
          ++condenseIndex;
        }
      }

      condenseCurrentLength = currentRow.filter(function (val) {
        return (val !== ' ' && val !== '_')
      }).length;

      // do some clean up
      if (flows.length > condenseCurrentLength) {
        flows.splice(condenseCurrentLength, flows.length - condenseCurrentLength);
      }

      // a little inline analysis and draw process
      for (let columnIndex = 0; columnIndex < currentRow.length; ) {
        let column = currentRow[columnIndex],
            prevColumn = currentRow[columnIndex - 1];

        if (currentRow[columnIndex] === ' ') {
          currentRow.splice(columnIndex, 1);
          x += self.config.unitSize;

          continue;
        }

        // inline intersect
        if ((column === '_' || column === '/')
            && currentRow[columnIndex - 1] === '|'
            && currentRow[columnIndex - 2] === '_') {
          inlineIntersect = true;

          let tempFlow = flows.splice(columnIndex - 2, 1)[0];
          flows.splice(columnIndex - 1, 0, tempFlow);
          currentRow.splice(columnIndex - 2, 1);

          columnIndex = columnIndex - 1;
        }
        else {
          inlineIntersect = false;
        }

        let color = flows[columnIndex].color;

        switch (column) {
          case '_' :
            drawLineRight(self, x, y, color);

            x += self.config.unitSize;
            break;

          case '*' :
            drawNode(self, x, y, color);
            break;

          case '@' :
            drawNode(self, x, y, color, true);
            break;

          case '|' :
            drawLineUp(self, x, y, color);
            break;

          case '/' :
            if (prevColumn
                && (prevColumn === '/' || prevColumn === ' ')) {
              x -= self.config.unitSize;
            }

            drawLineOut(self, x, y, color);

            x += self.config.unitSize;
            break;

          case '\\' :
            drawLineIn(self, x, y, color);
            break;
        }

        ++columnIndex;
      }

      y -= self.config.unitSize;
    }
  }

  if (typeof exports !== 'undefined' && typeof process !== 'undefined') {
    // Node.js module.
    module.exports = exports = daggit;
  }
  else if (typeof window === 'object') {
    // Browser loading.
    window.daggit = daggit;
  }

})();

/*
  Copyright (c) 2011--12, Terrence Lee <kill889@gmail.com>
  Copyright (c) 2017, Nic Sandfield <niczero@wow.com>
  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    - Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.
    - Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.
    - The names of its contributors may not be used to endorse or promote
      products derived from this software without specific prior written
      permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS-IS AND
  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT HOLDERS BE LIABLE FOR ANY DIRECT,
  INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
  BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
  DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
  OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
  EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
