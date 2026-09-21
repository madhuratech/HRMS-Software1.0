import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

const TRAIL_LENGTH = 12;

export function CustomCursor() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target;
      const isClickable =
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.closest('button') ||
      target.closest('a') ||
      target.style.cursor === 'pointer';

      setIsHovering(!!isClickable);
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, [mouseX, mouseY]);

  return (
    <>
      {Array.from({ length: TRAIL_LENGTH }).map((_, i) =>
      <CursorDot
        key={i}
        index={i}
        mouseX={mouseX}
        mouseY={mouseY}
        isHovering={isHovering} />

      )}
    </>);

}

function CursorDot({ index, mouseX, mouseY, isHovering }) {
  // First dot is very responsive, subsequent dots have more lag (drag)
  const springConfig = {
    damping: 25,
    stiffness: Math.max(50, 400 - index * 30), // Decrease stiffness for lag effect
    mass: 0.5 + index * 0.05 // Slight mass increase
  };

  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  // Size calculation
  const baseSize = 8;
  const size = Math.max(2, baseSize - index * 0.5);

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
      style={{ x, y }}>
      
      <motion.div
        animate={{
          scale: isHovering ? 1.5 : 1,
          opacity: Math.max(0.1, 1 - index * 0.08) // Fade out tail
        }}
        className="rounded-full bg-[#190E5D]"
        style={{
          width: size,
          height: size,
          x: '-50%', // Center the dot on the coordinate
          y: '-50%'
        }} />
      
    </motion.div>);

}