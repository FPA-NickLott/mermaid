// @ts-expect-error No types available for JISON
import { parser as ishikawa } from './parser/ishikawa.jison';
import { IshikawaDB } from './ishikawaDb.js';
import { setLogLevel } from '../../diagram-api/diagramAPI.js';

describe('when parsing an Ishikawa diagram', function () {
  beforeEach(function () {
    ishikawa.yy = new IshikawaDB();
    ishikawa.yy.clear();
    setLogLevel('trace');
  });

  it('should parse a basic Ishikawa hierarchy', function () {
    const str = `ishikawa-beta
    Blurry Photo
        Process
            Out of focus
        User
            Shaky hands
`;

    ishikawa.parse(str);
    const root = ishikawa.yy.getRoot();
    expect(root?.text).toEqual('Blurry Photo');
    expect(root?.children.length).toEqual(2);
    expect(root?.children[0].text).toEqual('Process');
    expect(root?.children[0].children[0].text).toEqual('Out of focus');
    expect(root?.children[1].text).toEqual('User');
    expect(root?.children[1].children[0].text).toEqual('Shaky hands');
  });

  it('should support an unindented root with nested causes', function () {
    const str = `ishikawa-beta
Problem
Cause A
  Subcause A1
Cause B
`;

    ishikawa.parse(str);
    const root = ishikawa.yy.getRoot();
    expect(root?.text).toEqual('Problem');
    expect(root?.children.length).toEqual(2);
    expect(root?.children[0].text).toEqual('Cause A');
    expect(root?.children[0].children[0].text).toEqual('Subcause A1');
    expect(root?.children[1].text).toEqual('Cause B');
  });

  it('should handle effect indented more than causes', function () {
    const str = `ishikawa-beta
    Problem
Cause A
  Subcause A1
Cause B
`;

    ishikawa.parse(str);
    const root = ishikawa.yy.getRoot();
    expect(root?.text).toEqual('Problem');
    expect(root?.children.length).toEqual(2);
    expect(root?.children[0].text).toEqual('Cause A');
    expect(root?.children[0].children.length).toEqual(1);
    expect(root?.children[0].children[0].text).toEqual('Subcause A1');
    expect(root?.children[1].text).toEqual('Cause B');
  });

  it.each(['ishikawa', 'ishikawa-beta'])('should mark individual items with %s', (header) => {
    ishikawa.parse(`${header}
    - Problem
-   Cause
  Active child
  -\tNested cause
    - Deep cause
Cause
`);
    const root = ishikawa.yy.getRoot();
    expect(root?.text).toBe('Problem');
    expect(root?.eliminated).toBe(true);
    expect(ishikawa.yy.getDiagramTitle()).toBe('Problem');
    expect(root?.children).toHaveLength(2);
    expect(root?.children[0]).toMatchObject({ text: 'Cause', eliminated: true });
    expect(root?.children[0].children[0]).toEqual({ text: 'Active child', children: [] });
    expect(root?.children[0].children[1]).toMatchObject({
      text: 'Nested cause',
      eliminated: true,
      children: [{ text: 'Deep cause', eliminated: true, children: [] }],
    });
    expect(root?.children[1]).toEqual({ text: 'Cause', children: [] });
  });

  it.each(['-Cause', '-5', '--Cause', '-', '-   ', 'Cause-with-hyphens', '− Cause', '– Cause'])(
    'should preserve literal label %s',
    (label) => {
      ishikawa.parse(`ishikawa\nProblem\n  ${label}\n`);
      expect(ishikawa.yy.getRoot()?.children[0]).toEqual({ text: label.trim(), children: [] });
    }
  );

  it('should preserve comments, blank lines, indentation, and sanitization', () => {
    ishikawa.parse(`ishikawa
Problem
  - Cause

  %% Comment
    - <script>alert(1)</script>Safe
  Active cause
`);
    const root = ishikawa.yy.getRoot();
    expect(root?.children).toHaveLength(2);
    expect(root?.children[0].children[0].eliminated).toBe(true);
    expect(root?.children[0].children[0].text).not.toContain('<script>');
    expect(root?.children[1]).toEqual({ text: 'Active cause', children: [] });
  });

  it('should reset elimination state between diagrams', () => {
    ishikawa.parse('ishikawa\n- Problem\n  - Cause\n');
    expect(ishikawa.yy.getRoot()?.eliminated).toBe(true);
    ishikawa.yy.clear();
    ishikawa.parse('ishikawa\nProblem\n  Cause\n');
    expect(ishikawa.yy.getRoot()).toEqual({
      text: 'Problem',
      children: [{ text: 'Cause', children: [] }],
    });
  });
});
