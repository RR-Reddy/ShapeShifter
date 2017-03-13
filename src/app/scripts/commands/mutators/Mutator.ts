import * as _ from 'lodash';
import { Point } from '../../common';
import { SvgChar } from '..';
import { PointMutator } from './PointMutator';
import { LineMutator } from './LineMutator';
import { BezierMutator } from './BezierMutator';
import { MoveMutator } from './MoveMutator';
import { CommandImpl } from '../CommandImpl';

/**
 * A wrapper around a backing SVG command that abstracts a lot of the math-y
 * path-related code from the rest of the application.
 */
export interface Mutator {
  getPathLength(): number;
  project(point: Point): ProjectionResult | undefined;
  split(t1: number, t2: number): Mutator;
  convert(svgChar: SvgChar): Mutator;
  findTimeByDistance(distance: number): number;
  toCommand(): CommandImpl;
  getBoundingBox(): BBox;
  intersects(line: Line): number[];
}

export function newMutator(cmd: CommandImpl): Mutator {
  if (cmd.svgChar === 'M') {
    return new MoveMutator(cmd.start, cmd.end);
  }
  const points = cmd.points;
  const uniquePoints = _.uniqWith(points, (p1, p2) => p1.equals(p2));
  if (uniquePoints.length === 1) {
    return new PointMutator(cmd.svgChar, points[0]);
  }
  if (cmd.svgChar === 'L' || cmd.svgChar === 'Z' || uniquePoints.length === 2) {
    return new LineMutator(cmd.svgChar, _.first(points), _.last(points));
  }
  if (cmd.svgChar === 'Q') {
    return new BezierMutator(cmd.svgChar, points[0], points[1], points[2]);
  }
  if (cmd.svgChar === 'C') {
    return new BezierMutator(
      cmd.svgChar, cmd.points[0], cmd.points[1], cmd.points[2], cmd.points[3]);
  }
  // TODO: create an elliptical arc path helper some day?
  throw new Error('Invalid command type: ' + cmd.svgChar);
}

/** Represents a projection onto a path. */
export interface ProjectionResult {
  /** The x-coordinate of the point on the path. */
  x: number;
  /** The y-coordinate of the point on the path. */
  y: number;
  /** The t-value of the point on the path. */
  t: number;
  /** The distance of the source point to the point on the path. */
  d: number;
}

/** Represents a rectangular bounding box. */
export interface BBox {
  x: MinMax;
  y: MinMax;
}

interface MinMax {
  min: number;
  max: number;
}

/** Represents a 2D line. */
export interface Line {
  p1: Point;
  p2: Point;
}
