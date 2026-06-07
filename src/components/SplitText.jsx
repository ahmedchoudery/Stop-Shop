'use client';

/**
 * @fileoverview SplitText.jsx — Editorial typography reveal animation
 * Splits a text string into individual words and reveals them vertically
 * with clipping boundaries as they scroll into view.
 */

import React from 'react';
import { motion } from 'framer-motion';

export default function SplitText({ children, className }) {
  if (typeof children !== 'string') return <span className={className}>{children}</span>;

  const words = children.split(' ');

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const childVariants = {
    hidden: { y: '100%' },
    visible: {
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  return (
    <motion.span
      className={`inline-block ${className || ''}`}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10%' }}
    >
      {words.map((word, idx) => (
        <span
          key={idx}
          className="inline-block overflow-hidden mr-[0.2em] pb-[0.05em] align-top"
        >
          <motion.span
            className="inline-block"
            variants={childVariants}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
