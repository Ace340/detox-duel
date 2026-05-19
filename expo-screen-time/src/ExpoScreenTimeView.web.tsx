import * as React from 'react';
import type { ExpoScreenTimeViewProps } from './ExpoScreenTime.types';

export default function ExpoScreenTimeView(props: ExpoScreenTimeViewProps) {
  // Screen time tracking doesn't need a view component
  // This is a placeholder for web compatibility
  const style = props.style as React.CSSProperties || {};

  return (
    <div style={style}>
      <p>Screen time tracking is not supported on web</p>
    </div>
  );
}
