var gitGraph = function (canvas, rawGraphList, config) {
  if (!canvas.getContext) {
    return;
  }
  
  if (typeof config === 'undefined') {
    config = {
      unitSize: 16,
      lineWidth: 4,
      nodeRadius: 5
    };
  }
  var theme = {
    nodeInnerColour: '#FFFFFF',
    nodeOuterColour: '#000000',
    nodeShadowColour: 'rgba(0, 0, 0, 0.5)'
  };
  
  var flows = [];
  var graphList = [];
  
  var ctx = canvas.getContext('2d');
  
  var devicePixelRatio = window.devicePixelRatio || 1;
  var backingStoreRatio = ctx.webkitBackingStorePixelRatio
    || ctx.mozBackingStorePixelRatio
    || ctx.msBackingStorePixelRatio
    || ctx.oBackingStorePixelRatio
    || ctx.backingStorePixelRatio
    || 1;

  var ratio = devicePixelRatio / backingStoreRatio;

  var init = function () {
    var maxWidth = 0;
    var i;
    var l = rawGraphList.length;
    var row;
    var midStr;
    
    for (i = 0; i < l; ++i) {
      midStr = rawGraphList[i].replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
      
      maxWidth = Math.max(midStr.replace(/(\_|\s)/g, '').length, maxWidth);
      
      row = midStr.split('');
      
      graphList.unshift(row);
    }
    
    var width = maxWidth * config.unitSize;
    var height = graphList.length * config.unitSize;

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    ctx.lineWidth = config.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.scale(ratio, ratio);
  };
  
  var genRandomStr = function () {
    var rnum = Math.floor(Math.random() * colours.length);
    return colours[rnum];
  };
  
  var findFlow = function (id) {
    var i = flows.length;
    
    while (i-- && flows[i].id !== id) {}
    
    return i;
  };
  
  var findColumn = function (symbol, row) {
    var i = row.length;
    
    while (i-- && row[i] !== symbol) {}
    
    return i;
  };
  
  var findBranchOut = function (row) {
    if (!row) {
      return -1
    }
    
    var i = row.length;
    
    while (i--
      && !(row[i - 1] && row[i] === '/' && row[i - 1] === '|')
      && !(row[i - 2] && row[i] === '_' && row[i - 2] === '|')) {}
    
    return i;
  }
  
  var genNewFlow = function () {
    var newId;
    
    do {
      newId = genRandomStr();
    } while (findFlow(newId) !== -1);
    
    return {id:newId, color:'#' + newId};
  };
  
  // draw method
  var drawLineRight = function (x, y, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x,                   y + config.unitSize / 2);
    ctx.lineTo(x + config.unitSize, y + config.unitSize / 2);
    ctx.stroke();
  };
  
  var drawLineUp = function (x, y, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + config.unitSize / 2);
    ctx.lineTo(x, y - config.unitSize / 2);
    ctx.stroke();
  };
  
  var drawNode = function (x, y, color) {
    ctx.strokeStyle = color;
    
    drawLineUp(x, y, color);
    
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = theme.nodeOuterColour;
    ctx.arc(x, y, config.nodeRadius, 0, Math.PI * 2, true);
    ctx.shadowOffsetX = config.nodeRadius / 2;
    ctx.shadowBlur = config.nodeRadius;
    ctx.shadowColor = theme.nodeShadowColour;
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = theme.nodeInnerColour;
    ctx.arc(x, y, config.nodeRadius / 2, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();
  };
  
  var drawLineIn = function (x, y, color) {
    ctx.strokeStyle = color;
    
    ctx.beginPath();
    ctx.moveTo(x + config.unitSize, y + config.unitSize / 2);
    ctx.bezierCurveTo(
      x + config.unitSize, y,
      x,                   y,
      x,                   y - config.unitSize / 2
    );
    ctx.stroke();
  };
  
  var drawLineOut = function (x, y, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + config.unitSize / 2);
    ctx.bezierCurveTo(
      x,                   y,
      x + config.unitSize, y,
      x + config.unitSize, y - config.unitSize / 2
    );
    ctx.stroke();
  };
  
  var draw = function (graphList) {
    var column, columnIndex, prevColumn, condenseIndex;
    var x, y;
    var color;
    var nodePos, outPos;
    var tempFlow;
    var prevRowLength = 0;
    var flowSwapPos = -1;
    var lastLinePos;
    var i, k, l;
    var condenseCurrentLength, condensePrevLength = 0, condenseNextLength = 0;
    
    var inlineIntersect = false;
    
    // initiate for first row
    for (i = 0, l = graphList[0].length; i < l; ++i) {
      if (graphList[0][i] !== '_' && graphList[0][i] !== ' ') {
        flows.push(genNewFlow());
      }
    }
    
    y = (canvas.height / ratio) - config.unitSize / 2;
    
    // iterate
    for (i = 0, l = graphList.length; i < l; ++i) {
      x = config.unitSize / 2;
      
      currentRow = graphList[i];
      nextRow = graphList[i + 1];
      prevRow = graphList[i - 1];
      
      flowSwapPos = -1;
      
      condenseCurrentLength = currentRow.filter(function (val) {
        return (val !== ' ' && val !== '_')
      }).length;
      
      if (nextRow) {
        condenseNextLength = nextRow.filter(function (val) {
          return (val !== ' ' && val !== '_')
        }).length;
      }
      else {
        condenseNextLength = 0;
      }
      
      // pre process begin
      // use last row for analysing
      if (prevRow) {
        if (!inlineIntersect) {
          // intersect might happen
          for (columnIndex = 0; columnIndex < prevRowLength; ++columnIndex) {
            if (prevRow[columnIndex + 1] && prevRow[columnIndex] === '/'
                && prevRow[columnIndex + 1] === '|'
              || prevRow[columnIndex] === '_' && prevRow[columnIndex + 1] === '|'
                && prevRow[columnIndex + 2] === '/') {
              flowSwapPos = columnIndex;
              
              // swap two flows
              tempFlow = {id:flows[flowSwapPos].id, color:flows[flowSwapPos].color};
              
              flows[flowSwapPos].id = flows[flowSwapPos + 1].id;
              flows[flowSwapPos].color = flows[flowSwapPos + 1].color;
              
              flows[flowSwapPos + 1].id = tempFlow.id;
              flows[flowSwapPos + 1].color = tempFlow.color;
            }
          }
        }
        
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
      columnIndex = 0;  // reset index
      condenseIndex = 0;
      condensePrevLength = 0;
      while (columnIndex < currentRow.length) {
        column = currentRow[columnIndex];
        
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
        
        ++columnIndex;
      }
      
      condenseCurrentLength = currentRow.filter(function (val) {
        return (val !== ' ' && val !== '_')
      }).length;
      
      // do some clean up
      if (flows.length > condenseCurrentLength) {
        flows.splice(condenseCurrentLength, flows.length - condenseCurrentLength);
      }
      
      columnIndex = 0;
      
      // a little inline analysis and draw process
      while (columnIndex < currentRow.length) {
        column = currentRow[columnIndex];
        prevColumn = currentRow[columnIndex - 1];
        
        if (currentRow[columnIndex] === ' ') {
          currentRow.splice(columnIndex, 1);
          x += config.unitSize;
          
          continue;
        }
        
        // inline interset
        if ((column === '_' || column === '/')
            && currentRow[columnIndex - 1] === '|'
            && currentRow[columnIndex - 2] === '_') {
          inlineIntersect = true;
          
          tempFlow = flows.splice(columnIndex - 2, 1)[0];
          flows.splice(columnIndex - 1, 0, tempFlow);
          currentRow.splice(columnIndex - 2, 1);
          
          columnIndex = columnIndex - 1;
        }
        else {
          inlineIntersect = false;
        }
        
        color = flows[columnIndex].color;
        
        switch (column) {
          case '_' :
            drawLineRight(x, y, color);
            
            x += config.unitSize;
            break;
            
          case '*' :
            drawNode(x, y, color);
            break;
            
          case '|' :
            drawLineUp(x, y, color);
            break;
            
          case '/' :
            if (prevColumn
                && (prevColumn === '/' || prevColumn === ' ')) {
              x -= config.unitSize;
            }
            
            drawLineOut(x, y, color);
            
            x += config.unitSize;
            break;
            
          case '\\' :
            drawLineIn(x, y, color);
            break;
        }
        
        ++columnIndex;
      }
      
      y -= config.unitSize;
    }
  };
  
  var colours = [
    "BCD9EA",
    "8BBDD9",
    "5BA4CF",
    "298FCA",
    "0079BF",
    "026AA7",
    "055A8C",
    "094C72",
    "0C3953",
    "D6ECD2",
    "B7DDB0",
    "99D18F",
    "7BC86C",
    "61BD4F",
    "5AAC44",
    "519839",
    "49852E",
    "3F6F21",
    "FCE8D2",
    "FAD8B0",
    "FDC788",
    "FFB968",
    "FFAB4A",
    "E99E40",
    "D29034",
    "BB8129",
    "A0711C",
    "F5D3CE",
    "EFB3AB",
    "EC9488",
    "EF7564",
    "EB5A46",
    "CF513D",
    "B04632",
    "933B27",
    "6E2F1A",
    "FAF3C0",
    "F5EA92",
    "F3E260",
    "F5DD29",
    "F2D600",
    "E6C60D",
    "D9B51C",
    "CCA42B",
    "BD903C",
    "DFC0EB",
    "D5A6E6",
    "CD8DE5",
    "C377E0",
    "A86CC1",
    "89609E",
    "6C547B",
    "484553",
    "FCDEF0",
    "FAC6E5",
    "FFB0E1",
    "FF95D6",
    "FF80CE",
    "E76EB1",
    "CD5A91",
    "B44772",
    "96304C",
    "BDECF3",
    "8FDFEB",
    "5DD3E5",
    "29CCE5",
    "00C2E0",
    "00AECC",
    "0098B7",
    "0082A0",
    "006988",
    "D3F6E4",
    "B3F1D0",
    "90ECC1",
    "6DECA9",
    "51E898",
    "4FD683",
    "4DC26B",
    "4CAF54",
    "4A9839",
    "FFFFFF",
    "EDEFF0",
    "E2E4E6",
    "D6DADC",
    "838C91",
    "676D70",
    "333333",
    "222222",
    "000000",
    "D2D7E5",
    "B2B9D0",
    "838FB5",
    "6170A1",
    "42548E",
    "3E4D80",
    "3A476F",
    "36405F",
    "30364C"
  ];

  init();
  draw(graphList);
};
/*
 * Copyright (c) 2011--12, Terrence Lee <kill889@gmail.com>
 * Copyright (c) 2017, Nic Sandfield <niczero@wow.com>
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the <organization> nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS AS-IS
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
