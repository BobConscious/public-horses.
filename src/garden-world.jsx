import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BookOpen, Compass } from 'lucide-react';
import { Button } from './components/controls.jsx';
import { drawGarden, paintTerrain } from './garden-world-art.js';
import { approach, gardenPath, landmarkAt, landmarkNear, spawn, stepPlayer, worldSize } from './garden-world-layout.js';

const directions = {
  arrowup: [0, -1], w: [0, -1],
  arrowdown: [0, 1], s: [0, 1],
  arrowleft: [-1, 0], a: [-1, 0],
  arrowright: [1, 0], d: [1, 0],
};

function targetName(target) {
  return target.kind === 'journal' ? 'the journal bench' : 'plot ' + target.number;
}

function interact(options, target) {
  if (!target || options.busy) return;
  if (target.kind === 'journal') options.onJournal();
  else options.onPlot(target.number);
}

function move(player, x, y) {
  const dx = x - player.x;
  const dy = y - player.y;
  player.moving = dx !== 0 || dy !== 0;
  if (!player.moving) return;
  player.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  player.x = x;
  player.y = y;
}

export default function GardenWorld({ canvasRef, plants, selectedSeed, busy, onPlot, onJournal }) {
  const options = useRef(null);
  const player = useRef({ ...spawn, facing: 'down', moving: false, path: [], target: null });
  const camera = useRef({ x: 0, y: 0 });
  const keys = useRef(new Set());
  const [near, setNear] = useState(null);
  const [walking, setWalking] = useState(null);
  const [available, setAvailable] = useState(true);

  useLayoutEffect(() => {
    options.current = { plants, selectedSeed, busy, onPlot, onJournal };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setAvailable(false);
      return;
    }
    const terrain = document.createElement('canvas');
    paintTerrain(terrain);
    const compact = window.matchMedia('(max-width: 650px)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)');
    const person = player.current;
    let lastTime = 0;
    let lastNear;
    let frame;

    function stopInput() {
      keys.current.clear();
      person.path = [];
      person.target = null;
      setWalking(null);
    }

    function tick(time) {
      const distance = Math.min(time - (lastTime || time), 45) * .112;
      lastTime = time;
      const width = compact.matches ? 276 : 480;
      const height = compact.matches ? 222 : 270;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      let dx = 0;
      let dy = 0;
      for (const key of keys.current) {
        dx += directions[key][0];
        dy += directions[key][1];
      }
      const amount = Math.hypot(dx, dy);
      person.moving = false;
      if (amount) {
        const start = stepPlayer(person, dx * distance / amount, dy * distance / amount);
        move(person, start.x, start.y);
      } else if (person.path.length) {
        const next = person.path[0];
        const left = Math.hypot(next.x - person.x, next.y - person.y);
        if (left <= distance) {
          move(person, next.x, next.y);
          person.path.shift();
        } else {
          move(person, person.x + (next.x - person.x) * distance / left, person.y + (next.y - person.y) * distance / left);
        }
        if (!person.path.length && person.target) {
          const target = person.target;
          person.target = null;
          setWalking(null);
          interact(options.current, target);
        }
      }
      const nearby = landmarkNear(person);
      if (nearby !== lastNear) {
        lastNear = nearby;
        setNear(nearby ?? null);
      }
      camera.current.x = Math.max(0, Math.min(worldSize.width - width, person.x - width / 2));
      camera.current.y = Math.max(0, Math.min(worldSize.height - height, person.y - height * .80));
      const current = options.current;
      drawGarden(ctx, terrain, camera.current, person, current.plants, nearby, Boolean(current.selectedSeed), still.matches ? 0 : time);
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    window.addEventListener('blur', stopInput);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('blur', stopInput);
      keys.current.clear();
    };
  }, [canvasRef]);

  function cancelWalk() {
    player.current.path = [];
    player.current.target = null;
    setWalking(null);
  }

  function walk(event) {
    if (busy) return;
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    canvas.focus({ preventScroll: true });
    keys.current.clear();
    const point = {
      x: camera.current.x + (event.clientX - bounds.left) * canvas.width / bounds.width,
      y: camera.current.y + (event.clientY - bounds.top) * canvas.height / bounds.height,
    };
    const target = landmarkAt(point);
    const person = player.current;
    const path = gardenPath(person, target ? approach(target) : point);
    cancelWalk();
    if (!path?.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const last = path.at(-1);
      move(person, last.x, last.y);
      interact(options.current, target);
      return;
    }
    person.path = path;
    person.target = target ?? null;
    setWalking(target ?? null);
  }

  function keyDown(event) {
    const key = event.key.toLowerCase();
    if (Object.hasOwn(directions, key)) {
      event.preventDefault();
      if (!busy) {
        cancelWalk();
        keys.current.add(key);
      }
    } else if (key === 'e' || key === 'enter') {
      event.preventDefault();
      if (!event.repeat && !player.current.path.length) interact(options.current, landmarkNear(player.current));
    } else if (key === 'escape') {
      keys.current.clear();
      cancelWalk();
    }
  }

  if (!available) return <p className="garden-world-unavailable">Use the garden plot list to plant and tend your seeds.</p>;
  const planted = near?.kind === 'plot' && plants.has(near.number);
  let action = 'Interact';
  if (near?.kind === 'journal') action = 'Open journal';
  else if (near) action = (planted ? 'Tend plot ' : selectedSeed ? 'Plant in plot ' : 'Choose a seed for plot ') + near.number;

  return (
    <div className="garden-world">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        role="group"
        aria-label="Walkable garden"
        aria-describedby="garden-instructions"
        width={480}
        height={270}
        onClick={walk}
        onKeyDown={keyDown}
        onKeyUp={(event) => keys.current.delete(event.key.toLowerCase())}
        onBlur={() => { keys.current.clear(); cancelWalk(); }}
      />
      <div className="garden-world-controls">
        <div>
          <p id="garden-instructions"><Compass size={16} aria-hidden="true" /> Tap to walk, or use the arrow keys and press E to interact.</p>
          <p role="status">{walking ? 'Walking to ' + targetName(walking) + '.' : near ? 'You’re at ' + targetName(near) + '.' : 'Walk to a plot or the journal bench.'}</p>
        </div>
        <Button variant="outline" disabled={!near || Boolean(walking) || busy} onClick={() => interact(options.current, near)}>
          {near?.kind === 'journal' && <BookOpen size={16} aria-hidden="true" />}{action}
        </Button>
      </div>
    </div>
  );
}
