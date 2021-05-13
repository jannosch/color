const log = ({ text, name, color }) => {
  const parent = document.querySelector('#events');
  const el = document.createElement('li');
  el.innerHTML = '[' + name + '] ' + text;
  el.style.color = color;

  parent.appendChild(el);
  parent.scrollTop = parent.scrollHeight;
};

let sock;
const onChatSubmitted = (sock) => (e) => {
  e.preventDefault();

  const input = document.querySelector('#chat');
  const text = input.value;
  let name = document.getElementById('name').value;
  if (name === "") {
      name = '?';
  }
  input.value = '';

  sock.emit('message', { text, name });
};

const getClickCoordinates = (element, ev) => {
  const { top, left }  = element.getBoundingClientRect();
  const { clientX, clientY } = ev;

  return {
    x: clientX - left,
    y: clientY - top,
  }
};

const changeColor = (color) => {
    if (color !== undefined) {
        document.getElementById('name').style.color = color;
        document.getElementById('color').value = color;
    }
};

const getBoard = (canvas, numCells = 20) => {
    const ctx = canvas.getContext('2d');
    const cellSize = Math.floor(canvas.width / numCells);

    const fillCell = (x, y, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }

    const drawGrid = () => {
      ctx.strokeStyle = '#333'
      ctx.beginPath();

      for (let i = 0; i < numCells; i++) {
        ctx.moveTo(i*cellSize, 0);
        ctx.lineTo(i*cellSize, canvas.height);
        ctx.moveTo(0, i*cellSize);
        ctx.lineTo(canvas.height, i*cellSize);
      }


      ctx.stroke();
    }

    const clear = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const renderBoard = (board = []) => {
        board.forEach((row, y) => {
            row.forEach((color, x) => {
                color && fillCell(x, y, color);
            });
        });
    };

    const reset = (board) => {
      clear();
      drawGrid();
      renderBoard(board);
    }

    const getCellCoordinates = (x, y) => {
      return {
        x: Math.floor(x / cellSize),
        y: Math.floor(y / cellSize),
      }
    }

    return { fillCell, reset, getCellCoordinates };
}

(() => {

  const canvas = document.querySelector('canvas');
  const { fillCell, reset, getCellCoordinates } = getBoard(canvas);
  const sock = io();

  const onClick = (e) => {
    const { x, y } = getClickCoordinates(canvas, e);
    sock.emit('turn', getCellCoordinates(x, y));
  };

  sock.on('board', ({ board, color }) => {
      changeColor(color);
      reset(board);
  });
  sock.on('message', log);
  sock.on('turn', ({ x, y, color }) => fillCell(x, y, color));

  document
    .querySelector('#chat-form')
    .addEventListener('submit', onChatSubmitted(sock));

  document.getElementById('color').addEventListener('change', (ev) => {
      const color = ev.target.value;
      document.getElementById('name').style.color = color;
      sock.emit('color', color);
  });

  canvas.addEventListener('click', onClick);


})();
