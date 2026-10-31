import { expect, test } from '@playwright/test';
import type { Locator } from '@playwright/test';
import { imgSnapshotTest, renderGraph, diagramSvg } from '../../../helpers/util.js';

const diagram = `ishikawa-beta
    - Ruled out problem
    - Equipment
        - Dirty lens with multiple wrapped words
            - Deep cause
        Active child
    - Process
        - Slow shutter<br/>Ruled out
            - Nested cause
        -Cause
`;

const verifyEliminatedLabels = async (svg: Locator) => {
  await expect(svg.locator('.ishikawa-eliminated-label')).toHaveCount(7);
  await expect(svg.locator('.ishikawa-elimination-symbol')).toHaveText(Array(7).fill('×'));
  const labels = await svg.locator('.ishikawa-eliminated-label').evaluateAll((groups) =>
    groups.map((group) => {
      const text = group.querySelector<SVGTextElement>('.ishikawa-eliminated-text')!;
      const symbol = group.querySelector<SVGTextElement>('.ishikawa-elimination-symbol')!;
      const textBox = text.getBoundingClientRect();
      const symbolBox = symbol.getBoundingClientRect();
      const unitBox = group.getBoundingClientRect();
      const box = group.parentElement?.querySelector('rect.ishikawa-label-box');
      const outerBox = box?.getBoundingClientRect();
      const head = group.parentElement?.querySelector<SVGGraphicsElement>('.ishikawa-head');
      const headBox = head?.getBoundingClientRect();
      const branches = group.parentElement?.querySelectorAll<SVGLineElement>('line') ?? [];
      const symbolClear = [...branches].every((branch) => {
        const matrix = branch.getScreenCTM()!;
        const start = new DOMPoint(
          branch.x1.baseVal.value,
          branch.y1.baseVal.value
        ).matrixTransform(matrix);
        const end = new DOMPoint(branch.x2.baseVal.value, branch.y2.baseVal.value).matrixTransform(
          matrix
        );
        return Array.from({ length: 101 }, (_, index) => index / 100).every((fraction) => {
          const pointX = start.x + (end.x - start.x) * fraction;
          const pointY = start.y + (end.y - start.y) * fraction;
          return (
            pointX <= symbolBox.left ||
            pointX >= symbolBox.right ||
            pointY <= symbolBox.top ||
            pointY >= symbolBox.bottom
          );
        });
      });
      return {
        decoration: getComputedStyle(text).textDecorationLine,
        symbolDecoration: getComputedStyle(symbol).textDecorationLine,
        separated: symbolBox.left >= textBox.right,
        lines: text.querySelectorAll('tspan').length,
        lineDecorations: [...text.querySelectorAll('tspan')].map((line) =>
          getComputedStyle(line).textDecorationLine === 'line-through'
            ? 'line-through'
            : getComputedStyle(text).textDecorationLine
        ),
        symbolClear,
        headContained:
          !headBox ||
          (unitBox.left >= headBox.left &&
            unitBox.right <= headBox.right &&
            unitBox.top >= headBox.top &&
            unitBox.bottom <= headBox.bottom),
        contained: !outerBox || (unitBox.left >= outerBox.left && unitBox.right <= outerBox.right),
        text: text.textContent,
      };
    })
  );
  for (const label of labels) {
    expect(label.decoration).toBe('line-through');
    expect(label.symbolDecoration).toBe('none');
    expect(label.separated).toBe(true);
    expect(label.contained).toBe(true);
    expect(label.headContained).toBe(true);
    expect(label.symbolClear, label.text ?? '').toBe(true);
    expect(label.lineDecorations.every((decoration) => decoration === 'line-through')).toBe(true);
    expect(label.text).not.toMatch(/^-/);
  }
  expect(labels.some((label) => label.lines > 1)).toBe(true);
  const plain = svg.locator(
    'text:not(.ishikawa-eliminated-text):not(.ishikawa-elimination-symbol)'
  );
  await expect(plain).toHaveText(['Active child', '-Cause']);
  expect(
    await plain.evaluateAll((texts) =>
      texts.every((text) => getComputedStyle(text).textDecorationLine === 'none')
    )
  ).toBe(true);
};

for (const theme of ['default', 'dark', 'forest'] as const) {
  for (const look of ['classic', 'handDrawn'] as const) {
    test(`eliminated labels with ${theme} theme and ${look} look`, async ({ page }, testInfo) => {
      await imgSnapshotTest(
        page,
        testInfo,
        diagram,
        { theme, look, securityLevel: 'strict' },
        false,
        verifyEliminatedLabels
      );
    });
  }
}

test('eliminated labels with larger text and subsequent ordinary diagrams', async ({
  page,
}, testInfo) => {
  await imgSnapshotTest(
    page,
    testInfo,
    diagram,
    { fontSize: 24, securityLevel: 'strict' },
    false,
    verifyEliminatedLabels
  );
  await renderGraph(page, testInfo, 'ishikawa\nProblem\n  Cause\n    Active child', {
    screenshot: false,
  });
  await expect(diagramSvg(page).locator('.ishikawa-eliminated-label')).toHaveCount(0);
  await expect(diagramSvg(page).locator('.ishikawa-elimination-symbol')).toHaveCount(0);
});
