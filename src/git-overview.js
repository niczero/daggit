; (function () {
  'use strict'

  let defaultLightPalette = [
    'D29034',
    '4DC26B',
    '026AA7',
    'A86CC1',
    '484553',
    '30364C',
    '000000',
    'EB5A46',
    '933B27',
    'B44772',
    '0079BF',
    '42548E',
    '49852E',
    'CF513D',
    'CD5A91',
    'C377E0',
    '61BD4F',
    'E99E40',
    'E6C60D',
    '4CAF54',
    'FFAB4A',
    '00AECC',
    'F2D600',
    '51E898',
    '3A476F',
    '222222',
    '094C72',
    'A0711C',
    '6E2F1A',
    '3E4D80',
    '00C2E0',
    'BB8129',
    'FF80CE',
    '6C547B',
    'CCA42B',
    'D9B51C',
    '0C3953',
    '3F6F21',
    '519839',
    '333333',
    '5AAC44',
    '0082A0',
    '055A8C',
    '4A9839',
    '006988',
    '36405F',
    '676D70',
    'E76EB1',
    'BD903C',
    '96304C',
    '0098B7',
    '4FD683',
    '89609E',
    'B04632',
  ]
let  defaultDarkPalette = [
    '298FCA',
    'EC9488',
    'D6DADC',
    '4FD683',
    'E6C60D',
    'F5DD29',
    'B3F1D0',
    'FF95D6',
    'CF513D',
    '0079BF',
    'FDC788',
    'F2D600',
    'DFC0EB',
    'B7DDB0',
    'E76EB1',
    '7BC86C',
    '3E4D80',
    'F3E260',
    '838FB5',
    '8FDFEB',
    '6170A1',
    'B2B9D0',
    'D5A6E6',
    '676D70',
    '5AAC44',
    '6DECA9',
    '90ECC1',
    'EFB3AB',
    '838C91',
    'E2E4E6',
    '61BD4F',
    'CD8DE5',
    '333333',
    'FFAB4A',
    'F5EA92',
    'FAC6E5',
    'A86CC1',
    'FFB968',
    '42548E',
    '29CCE5',
    '8BBDD9',
    '99D18F',
    '51E898',
    '00AECC',
    '5DD3E5',
    'E99E40',
    '5BA4CF',
    '00C2E0',
    'FF80CE',
    'EF7564',
    'FFB0E1',
    'FAD8B0',
    'C377E0',
    '026AA7',
    'EB5A46',
  ]

  function Overview (canvas, rawGraphList, config) {
    if (!canvas.getContext) {
      return
    }

    // Config

    this.config = config || {}
    this.config.xSize = this.config.xSize || 16
    this.config.ySize = this.config.ySize || this.config.xSize
    this.config.lineWidth = this.config.lineWidth || 3

    this.config.theme = this.config.theme || {}
    if (!this.config.theme.palette) {
      if ((this.config.theme.name || 'light') === 'light') {
        this.config.theme.palette = defaultLightPalette

        this.config.theme.node = this.config.theme.node || {
          inner: 'fff',
          outer: '000',
          shadow: 'rgba(250, 250, 250, 0.9)',
        }
      }
      else {
        this.config.theme.palette = defaultDarkPalette

        this.config.theme.node = this.config.theme.node || {
          inner: '000',
          outer: 'fff',
          shadow: 'rgba(200, 200, 200, 0.4)',
        }
      }
    }
    this.config.theme.node.radius = this.config.theme.node.radius || 5

    // Context

    let ctx = (this.ctx = canvas.getContext('2d'))

    let devicePixelRatio = window.devicePixelRatio || 1
    let backingStoreRatio =
      ctx.webkitBackingStorePixelRatio
      || ctx.mozBackingStorePixelRatio
      || ctx.msBackingStorePixelRatio
      || ctx.oBackingStorePixelRatio
      || ctx.backingStorePixelRatio
      || 1

    this.ratio = devicePixelRatio / backingStoreRatio

    let maxWidth = 0
    let height = rawGraphList.length

    this.grid = []
    for (let r = 0; r < height; ++r) {
      let columnar = rawGraphList[r].replace(/^\s+|\s+$/g, '')

      let width = columnar.replace(/(\s|_|-|\.)/g, '').length
      maxWidth = width > maxWidth ? width : maxWidth

      this.grid.unshift(columnar.split('')) // reverse order of rows
    }

    let w = maxWidth * this.config.xSize
    let h = height * this.config.ySize

    // Canvas

    canvas.width = w * this.ratio
    canvas.height = h * this.ratio

    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    this.canvas = canvas

    ctx.lineWidth = this.config.lineWidth
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    ctx.scale(this.ratio, this.ratio)

    this.used = 0 // counter of palette colours used so far
    this.tracks = [] // evolving list of current commit/branch threads
  }

  Overview.prototype.newTrack = function () {
    let t = this.used++ % this.config.theme.palette.length
    return this.config.theme.palette[t]
  }

  Overview.prototype.drawShape = function (
    x,
    y,
    x1,
    y1,
    x2,
    y2,
    x3,
    y3,
    color
  ) {
    let ctx = this.ctx
    let xsize = this.config.xSize
    let ysize = this.config.ySize
    ctx.strokeStyle = '#' + color
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.bezierCurveTo(
      x + xsize * x1, y - ysize * y1,
      x + xsize * x2, y - ysize * y2,
      x + xsize * x3, y - ysize * y3
    )
    ctx.stroke()
  }

  Overview.prototype.drawArcRightThenUp = function (x, y, color) {
    this.drawShape(x, y, 0.5, 0, 1, 0.5, 1, 1, color)
  }

  Overview.prototype.drawArcUpThenRight = function (x, y, color) {
    this.drawShape(x, y, 0, 0.5, 0.5, 1, 1, 1, color)
  }

  Overview.prototype.drawDiagRightEntry = function (x, y, color) {
    this.drawShape(x, y, 0, 0.5, 0.5, 0.5, 1, 1, color)
  }

  Overview.prototype.drawDiagRightExit = function (x, y, color) {
    this.drawShape(x, y, 0.5, 0.5, 1, 0.5, 1, 1, color)
  }

  Overview.prototype.drawLineLeft = function (x, y, color) {
    this.drawShape(x, y, 0, 0.5, 0.5, 0.5, 1, 0.5, color)
  }

  Overview.prototype.drawLineRight = function (x, y, color) {
    let ctx = this.ctx
    ctx.strokeStyle = '#' + color
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + this.config.xSize, y)
    ctx.stroke()
  }

  Overview.prototype.drawLineUp = function (x, y, color) {
    let ctx = this.ctx
    ctx.strokeStyle = '#' + color
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, y - this.config.ySize)
    ctx.stroke()
  }

  Overview.prototype.drawNode = function (x, y, color, selected) {
    let ctx = this.ctx
    ctx.strokeStyle = '#' + color

    this.drawLineUp(x, y, color)

    let cnode = this.config.theme.node

    ctx.save()
    ctx.beginPath()
    ctx.fillStyle = '#' + cnode.outer
    ctx.arc(x, y - this.config.ySize / 2, cnode.radius, 0, Math.PI * 2)
    if (selected) {
      ctx.shadowOffsetX = cnode.radius / 2
      ctx.shadowBlur = cnode.radius
      ctx.shadowColor = cnode.shadow
    }
    ctx.fill()
    if (!selected) {
      ctx.beginPath()
      ctx.fillStyle = '#' + cnode.inner
      ctx.arc(x, y - this.config.ySize / 2, cnode.radius / 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  Overview.prototype.drawSwitchLeft = function (x, y, color) {
    this.drawShape(x, y, 0, 0.5, -1, 0.5, -1, 1, color)
  }

  Overview.prototype.drawSwitchRight = function (x, y, color) {
    this.drawShape(x, y, 0, 0.5, 1, 0.5, 1, 1, color)
  }

  Overview.prototype.draw = function () {
    let grid = this.grid

    // Initialise for first row
    for (let c = 0, width = grid[0].length; c < width; ++c) {
      let cell = grid[0][c]
      if (cell !== ' ' && cell !== '_' && cell !== '-' && cell !== '.') {
        this.tracks.push(this.newTrack())
      }
    }

    let y = this.canvas.height / this.ratio
    let expectCrossover

    // Iterate over all rows
    for (let r = 0, height = grid.length; r < height; ++r) {
      let x = this.config.xSize / 2
      let row = grid[r]
      let maybeCrossover = expectCrossover
      expectCrossover = false

      // Iterate over all columns of the row
      let track = 0
      for (let c = 0, width = row.length; c < width; ++c) {
        let cell = row[c]
        let prevCell = row[c - 1]

        // Massage certain patterns

        // " "
        if (cell === ' ') {
          if (c && prevCell === ' ') {
            row[c] = ''
          }
          else if (c && prevCell !== ' ' && prevCell !== '/') {
            x += this.config.xSize
          }
          continue
        }

        // "|"
        else if (cell === '|') {
          // Check for "|/" or "|_"
          if (
            maybeCrossover &&
            prevCell !== '_' &&
            (row[c + 1] === '/' || row[c + 1] === '_')
          ) {
            // crossover => swap tracks
            let temp = this.tracks[track]
            this.tracks[track] = this.tracks[track + 1]
            this.tracks[track + 1] = temp
          }
          // Check for "/|"
          else if (prevCell === '/') {
            expectCrossover = true
          }
        }

        // "_" / "/"
        // For crossovers, one track jumps over another
        // Check for "_|_" or "_|/"
        else if (
          (cell === '_' || cell === '/')
          && prevCell === '|'
          && row[c - 2] === '_'
        ) {
          // crossover => swap tracks
          let temp = this.tracks[track - 2]
          this.tracks[track - 2] = this.tracks[track - 1]
          this.tracks[track - 1] = temp
          --track
        }

        // "/"
        else if (cell === '/') {
          // Spawn a new track "|/" (that is not part of a crossover)
          if (!maybeCrossover && c && prevCell === '|') {
            this.tracks.splice(track, 0, this.newTrack())
          }
          else if (grid[r - 1] && grid[r - 1][c - 1] === '/') {
            row[c] = cell = '|'
          }
        }

        // "\"
        else if (cell === '\\' && grid[r - 1] && grid[r - 1][c + 1] === '\\') {
          row[c] = cell = '|'
        }

        // "*" / "@"
        // Merged tracks disappear
        else if (
          (cell === '*' || cell === '@') &&
          r &&
          c < width - 1 &&
          grid[r - 1][c + 1] === '\\'
        ) {
          this.tracks.splice(track + 1, 1)
        }

        // "-"
        // Multi-merge
        else if (cell === '-' && row[c + 1] === '-') {
          row[c + 1] = ' '
        }

        let color = this.tracks[track]

        switch (cell) {
          case '*':
            this.drawNode(x, y, color)
            break

          case '@':
            this.drawNode(x, y, color, true)
            break

          case '|':
            this.drawLineUp(x, y, color)
            break

          case '/':
            if (grid[r + 1] && grid[r + 1][c + 1] === '/') {
              // Leads straight into another "/"
              this.drawDiagRightExit(x, y, color)
              x -= this.config.xSize
            }
            else if (grid[r + 1] && grid[r + 1][c + 2] === '_') {
              this.drawArcUpThenRight(x, y, color)
            }
            else if (row[c - 2] === '_') {
              this.drawArcRightThenUp(x, y, color)
            }
            else if (
              row[c + 1] === '|' &&
              grid[r + 1] &&
              grid[r + 1][c + 2] === '/' &&
              row[c - 1] === '|' &&
              grid[r - 1] &&
              grid[r - 1][c - 2] === '/'
            ) {
              // Internal diagonal crossover
              this.drawSwitchRight(x, y, color)
            }
            else if (
              row[c + 1] === '|' &&
              grid[r + 1] &&
              grid[r + 1][c + 2] === '/'
            ) {
              // Initial diagonal crossover
              this.drawDiagRightEntry(x, y, color)
            }
            else if (
              row[c - 1] === '|' &&
              grid[r - 1] &&
              grid[r - 1][c - 2] === '/'
            ) {
              // Ultimate diagonal crossover
              this.drawDiagRightExit(x, y, color)
            }
            else {
              // Simple slope
              this.drawSwitchRight(x, y, color)
            }
            x += this.config.xSize
            break

          case '\\':
            this.drawSwitchLeft(x + this.config.xSize, y, color)
            break

          case '_':
            this.drawLineRight(x, y, color)
            x += this.config.xSize
            break

          case '-':
            if (row[c - 1] === '*' || row[c - 1] === '@') {
              x += this.config.xSize
            }
            this.drawLineLeft(x, y, color)
            this.tracks.splice(track--, 1)

            if (row[c - 1] === '*' || row[c - 1] === '@') {
              // Redraw node
              this.drawNode(x - this.config.xSize, y, this.tracks[track])
            }
            break

          case '.':
            --track
            break
        }

        ++track
      }

      y -= this.config.ySize
      if (this.tracks.length > track) {
        // Drop redundant tracks
        this.tracks.splice(track, this.tracks.length - track)
      }
    }
  }

  if (typeof exports !== 'undefined' && typeof process !== 'undefined') {
    // Node.js module.
    module.exports = exports = Overview
  }
  else if (typeof window === 'object') {
    // Browser loading.
    window.Overview = Overview
  }
})()

/*
  Copyright (c) 2011--12, Terrence Lee <kill889@gmail.com>
  Copyright (c) 2017--24, Nic Sandfield <niczero@wow.com>
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
