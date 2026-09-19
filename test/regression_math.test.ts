import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateLinearRegression, calculateStdDev } from '../lib/trend/regression';

test('TC-REG-01: calculateLinearRegression - Decaying scores (Negative slope, perfect fit)', () => {
  const points = [
    { x: 0, y: 10 },
    { x: 1, y: 8 },
    { x: 2, y: 6 },
    { x: 3, y: 4 },
  ];
  const res = calculateLinearRegression(points);
  assert.equal(res.slope, -2.0);
  assert.equal(res.intercept, 10.0);
  assert.equal(res.rSquared, 1.0);
});

test('TC-REG-02: calculateLinearRegression - Improving scores (Positive slope, perfect fit)', () => {
  const points = [
    { x: 0, y: 2 },
    { x: 1, y: 4 },
    { x: 2, y: 6 },
  ];
  const res = calculateLinearRegression(points);
  assert.equal(res.slope, 2.0);
  assert.equal(res.intercept, 2.0);
  assert.equal(res.rSquared, 1.0);
});

test('TC-REG-03: calculateLinearRegression - Horizontal line (No change in score)', () => {
  const points = [
    { x: 0, y: 7 },
    { x: 1, y: 7 },
    { x: 2, y: 7 },
    { x: 3, y: 7 },
  ];
  const res = calculateLinearRegression(points);
  assert.equal(res.slope, 0);
  assert.equal(res.intercept, 7.0);
  assert.equal(res.rSquared, 0);
});

test('TC-REG-04: calculateLinearRegression - Vertical points (Zero variance in X, avoid divide-by-zero)', () => {
  const points = [
    { x: 1, y: 4 },
    { x: 1, y: 8 },
  ];
  const res = calculateLinearRegression(points);
  assert.equal(res.slope, 0);
  assert.equal(res.intercept, 6.0);
  assert.equal(res.rSquared, 0);
});

test('TC-REG-05: calculateLinearRegression - Boundary: Single data point (n = 1)', () => {
  const points = [{ x: 0, y: 8 }];
  const res = calculateLinearRegression(points);
  assert.equal(res.slope, 0);
  assert.equal(res.intercept, 8);
  assert.equal(res.rSquared, 0);
});

test('TC-REG-06: calculateLinearRegression - Boundary: Empty data points (n = 0)', () => {
  const points: Array<{ x: number; y: number }> = [];
  const res = calculateLinearRegression(points);
  assert.equal(res.slope, 0);
  assert.equal(res.intercept, 5); // Fallback default score
  assert.equal(res.rSquared, 0);
});

test('TC-REG-07: calculateStdDev - Normal, empty, single element, identical values', () => {
  assert.equal(calculateStdDev([]), 0, 'Empty array should have stdDev 0');
  assert.equal(calculateStdDev([5]), 0, 'Single value should have stdDev 0');
  assert.equal(calculateStdDev([6, 6, 6, 6]), 0, 'Identical values should have stdDev 0');

  // Sample with known sample variance: [2, 4, 4, 4, 5, 5, 7, 9] -> mean=5, sample stdDev=2.1381
  const std = calculateStdDev([2, 4, 4, 4, 5, 5, 7, 9]);
  assert.equal(std, 2.1381);
});
