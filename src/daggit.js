(function () {
  'use strict';

  var self = {},
      tracks = [],
      grid = [];

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

    let maxWidth = 0,
        height = rawGraphList.length;

    for (let r = 0; r < height; ++r) {
      let columnar = rawGraphList[r].replace(/^\s+|\s+$/g, '');

      let width = columnar.replace(/(\s|_|-|\.)/g, '').length;
      maxWidth = width > maxWidth ? width : maxWidth;

      grid.unshift(columnar.split(''));  // reverse order of rows
    }

    let w = maxWidth * self.config.unitSize,
        h = height * self.config.unitSize;

    canvas.width = w * self.ratio;
    canvas.height = h * self.ratio;

    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    self.canvas = canvas;

    ctx.lineWidth = self.config.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.scale(self.ratio, self.ratio);

    self.used = 0;
    draw(self, grid);
  }

  function newTrack (self) {
    let t = self.used++ % self.config.theme.palette.length;
    return self.config.theme.palette[t];
  }

  function drawArcRightSlopeRight (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = '#'+ color;
    ctx.beginPath();
    ctx.moveTo(x, y + self.config.unitSize / 2);
    ctx.bezierCurveTo(
      x + self.config.unitSize / 4, y + self.config.unitSize / 2,
      x + self.config.unitSize,     y,
      x + self.config.unitSize,     y - self.config.unitSize / 2
    );
    ctx.stroke();
  }

  function drawArcRightUp (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = '#'+ color;

    ctx.beginPath();
    ctx.moveTo(x, y + self.config.unitSize / 2);
    ctx.bezierCurveTo(
      x + self.config.unitSize / 2, y + self.config.unitSize / 2,
      x + self.config.unitSize, y,
      x + self.config.unitSize, y - self.config.unitSize / 2
    );
    ctx.stroke();
  }

  function drawArcUpRight (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = '#'+ color;
    ctx.beginPath();
    ctx.moveTo(x, y + self.config.unitSize / 2);
    ctx.bezierCurveTo(
      x,                            y,
      x + self.config.unitSize / 2, y - self.config.unitSize / 2,
      x + self.config.unitSize,     y - self.config.unitSize / 2
    );
    ctx.stroke();
  }

  function drawDiagLeft (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = '#'+ color;

    ctx.beginPath();
    ctx.moveTo(x, y + self.config.unitSize / 2);
    ctx.bezierCurveTo(
      x - self.config.unitSize / 4, y,
      x - self.config.unitSize / 4, y,
      x - self.config.unitSize / 2, y - self.config.unitSize / 2
    );
    ctx.stroke();
  }

  function drawDiagLeftLast (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = '#'+ color;

    ctx.beginPath();
    ctx.moveTo(x, y + self.config.unitSize / 2);
    ctx.bezierCurveTo(
      x - self.config.unitSize / 4, y,
      x - self.config.unitSize / 2, y,
      x - self.config.unitSize / 2, y - self.config.unitSize / 2
    );
    ctx.stroke();
  }

  function drawDiagRight (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = '#'+ color;

    ctx.beginPath();
    ctx.moveTo(x, y + self.config.unitSize / 2);
    ctx.bezierCurveTo(
      x,                            y,
      x + self.config.unitSize / 4, y,
      x + self.config.unitSize / 2, y - self.config.unitSize / 2
    );
    ctx.stroke();
  }

  function drawLineLeft (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = '#'+ color;
    ctx.beginPath();
    ctx.moveTo(x, y + self.config.unitSize / 2);
    ctx.bezierCurveTo(
      x,                            y,
      x - self.config.unitSize / 2, y,
      x - self.config.unitSize,     y
    );
    ctx.stroke();
  }

  function drawLineRight (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = '#'+ color;
    ctx.beginPath();
    ctx.moveTo(x,                        y + self.config.unitSize / 2);
    ctx.lineTo(x + self.config.unitSize, y + self.config.unitSize / 2);
    ctx.stroke();
  }

  function drawLineUp (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = '#'+ color;
    ctx.beginPath();
    ctx.moveTo(x, y + self.config.unitSize / 2);
    ctx.lineTo(x, y - self.config.unitSize / 2);
    ctx.stroke();
  }

  function drawNode (self, x, y, color, selected) {
    let ctx = self.ctx;
    ctx.strokeStyle = '#'+ color;

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

  function drawSlopeLeft (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = '#'+ color;

    ctx.beginPath();
    ctx.moveTo(x + self.config.unitSize, y + self.config.unitSize / 2);
    ctx.bezierCurveTo(
      x + self.config.unitSize, y,
      x,                        y,
      x,                        y - self.config.unitSize / 2
    );
    ctx.stroke();
  }

  function drawSlopeRight (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = '#'+ color;
    ctx.beginPath();
    ctx.moveTo(x, y + self.config.unitSize / 2);
    ctx.bezierCurveTo(
      x,                        y,
      x + self.config.unitSize, y,
      x + self.config.unitSize, y - self.config.unitSize / 2
    );
    ctx.stroke();
  }

  function drawSlopeRightFirst (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = '#'+ color;
    ctx.beginPath();
    ctx.moveTo(x, y + self.config.unitSize / 2);
    ctx.bezierCurveTo(
      x,                        y,
      x + self.config.unitSize / 2, y,
      x + self.config.unitSize, y - self.config.unitSize / 2
    );
    ctx.stroke();
  }

  function drawSlopeRightLast (self, x, y, color) {
    let ctx = self.ctx;
    ctx.strokeStyle = '#'+ color;
    ctx.beginPath();
    ctx.moveTo(x, y + self.config.unitSize / 2);
    ctx.bezierCurveTo(
      x + self.config.unitSize / 2, y,
      x + self.config.unitSize, y,
      x + self.config.unitSize, y - self.config.unitSize / 2
    );
    ctx.stroke();
  }

  function draw (self, grid) {

    // Initialise for first row
    for (let c = 0, width = grid[0].length; c < width; ++c) {
      let cell = grid[0][c];
      if (cell !== ' ' && cell !== '_' && cell !== '-' && cell !== '.') {
        tracks.push(newTrack(self));
      }
    }

    let y = (self.canvas.height / self.ratio) - self.config.unitSize / 2,
        expectCrossover;

    // Iterate over all rows
    for (let r = 0, height = grid.length; r < height; ++r) {

      let x = self.config.unitSize / 2,
          row = grid[r],
          maybeCrossover = expectCrossover;
      expectCrossover = false;

      // Iterate over all columns of the row
      let track = 0;
      for (let c = 0, width = row.length; c < width; ++c) {
        let cell = row[c],
            prevCell = row[c - 1];

        // Massage certain patterns

        // " "
        if (cell === ' ') {
          if (c && prevCell !== '/') {
            x += self.config.unitSize;
          }
          continue;
        }

        // "_" / "/"
        // For crossovers, one track jumps over another
        // Check for "_|_" or "_|/"
        else if ((cell === '_' || cell === '/')
            && prevCell === '|'
            && row[c - 2] === '_') {

          // crossover => swap tracks
          let temp = tracks[track - 2];
          tracks[track - 2] = tracks[track - 1];
          tracks[track - 1] = temp;
          --track;
        }

        // "|"
        // Check for "|/" or "|_" or "/|"
        else if (cell === '|') {
          if (maybeCrossover && prevCell !== '_'
              && (row[c + 1] === '/' || row[c + 1] === '_')) {
            // crossover => swap tracks
            let temp = tracks[track];
            tracks[track] = tracks[track + 1];
            tracks[track + 1] = temp;
          }
          else if (prevCell === '/') {
            expectCrossover = true;
          }
        }

        // "/"
        // Spawn a new track "|/" (that is not part of a crossover)
        else if (!maybeCrossover && cell === '/' && c && row[c - 1] === '|') {
          tracks.splice(track, 0, newTrack(self));
        }

        // "*" / "@"
        // Merged tracks disappear
        else if ((cell === '*' || cell === '@') && r && c < width - 1
            && grid[r - 1][c + 1] === '\\') {
          tracks.splice(track + 1, 1);
        }

        // "-"
        // Multi-merge
        else if (cell === '-' && row[c + 1] === '-') {
          row[c + 1] = ' ';
        }

        // "\"
        else if (cell === '\\') {
//          let z = grid[r + 1] && c ? grid[r + 1][c - 1] : '';
//          if (z === '\\') {
//          }
        }

        let color = tracks[track];

        switch (cell) {
          case '*':
            drawNode(self, x, y, color);
            break;

          case '@':
            drawNode(self, x, y, color, true);
            break;

          case '|':
            drawLineUp(self, x, y, color);
            break;

          case '/':
            if (grid[r + 1] && grid[r + 1][c + 1] === '/') {
              // Leads straight into another "/"
              if (row[c - 2] === '_') {
                // Coming from a horizontal crossover
                grid[r + 1][c + 1] = '|';  // modify the structure for space

                drawArcRightUp(self, x, y, color);
              }
              else {
                let i = c;
                while (row[--i] === ' ') {}
                x -= (c - 1 - i) * self.config.unitSize / 2;

                drawDiagRight(self, x, y, color);
              }
              x -= self.config.unitSize;
            }
            else if (grid[r + 1] && grid[r + 1][c + 2] === '_') {
              drawArcUpRight(self, x, y, color);
            }
            else if (row[c - 2] === '_') {
              drawArcRightSlopeRight(self, x, y, color);
            }
            else if (row[c + 1] === '|'
                && grid[r + 1] && grid[r + 1][c + 2] === '/'
                && row[c - 1] === '|'
                && grid[r - 1] && grid[r - 1][c - 2] === '/') {
              // Internal diagonal crossover
              drawSlopeRight(self, x, y, color);
            }
            else if (row[c + 1] === '|'
                && grid[r + 1] && grid[r + 1][c + 2] === '/') {
              // Initial diagonal crossover
              drawSlopeRightFirst(self, x, y, color);
            }
            else if (row[c - 1] === '|'
                && grid[r - 1] && grid[r - 1][c - 2] === '/') {
              // Ultimate diagonal crossover
              drawSlopeRightLast(self, x, y, color);
            }
            else {
              // Simple slope
              drawSlopeRight(self, x, y, color);
            }
            x += self.config.unitSize;
            break;

          case '\\':
            if (grid[r - 1] && grid[r - 1][c + 1] === '\\') {
              let i = c;
              while (row[--i] === ' ') {}
              x -= (c - 2 - i) * self.config.unitSize / 2;

              if (grid[r + 1] && grid[r + 1][c - 1] !== '\\') {
                drawDiagLeftLast(self, x, y, color);
              }
              else {
                drawDiagLeft(self, x, y, color);
              }
            }
            else {
              drawSlopeLeft(self, x, y, color);
            }
            break;

          case '_':
            drawLineRight(self, x, y, color);
            x += self.config.unitSize;
            break;

          case '-':
            if (c && (prevCell === '*' || prevCell === '@')) {
              x += self.config.unitSize;
            }
            drawLineLeft(self, x, y, color);
            tracks.splice(track--, 1);

            if (row[c - 1] === '*' || row[c - 1] === '@') {
              // Redraw node
              drawNode(self, x - self.config.unitSize, y, tracks[track]);
            }
            break;

          case '.':
            --track;
            break;

        }

        ++track;
      }

      y -= self.config.unitSize;
      if (tracks.length > track) {
        // Drop redundant tracks
        tracks.splice(track, tracks.length - track);
      }
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
  Copyright (c) 2017--18, Nic Sandfield <niczero@wow.com>
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
