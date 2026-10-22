import { Children, Fragment, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { hairline, radius, space, type, useColors } from './theme';

// iOS "inset grouped" list section: a bold sentence-case header (Health style), rounded card of rows with hairlines, optional footer.
export function Section({ header, right, footer, children }: { header?: string; right?: string; footer?: ReactNode; children: ReactNode }) {
  const c = useColors();
  const rows = Children.toArray(children).filter(Boolean);
  return (
    <View style={{ paddingHorizontal: space.lg }}>
      {(header || right) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: space.xs, paddingBottom: space.sm }}>
          <Text style={[type.title3, { color: c.label }]}>{header}</Text>
          {right ? <Text style={[type.footnote, { color: c.secondary }]}>{right}</Text> : null}
        </View>
      )}
      <View style={{ backgroundColor: c.card, borderRadius: radius.lg, overflow: 'hidden' }}>
        {rows.map((row, i) => (
          <Fragment key={i}>
            {i > 0 && <View style={{ height: hairline, backgroundColor: c.separator, marginLeft: space.lg }} />}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <Text style={[type.footnote, { color: c.secondary, paddingHorizontal: space.lg, paddingTop: 6 }]}>{footer}</Text>
      ) : null}
    </View>
  );
}
