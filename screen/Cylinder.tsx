import React from 'react';
import Svg, { Ellipse, Rect, Defs, ClipPath, Line } from 'react-native-svg';

const Cylinder = ({ 
  width = 55, 
  height = 150, 
  fillPercent = 0.5, 
  color = '#2a9d8f', 
  strokeColor = '#2a9d8f', 
  strokeWidth = 2 
}) => {
  const padding = 6; // margine interno per non far tagliare il bordo

  const innerWidth = width - 2 * padding;
  const innerHeight = height - 2 * padding;

  const ellipseRx = innerWidth * 0.5;
  const ellipseRy = innerWidth * 0.15;
  const bodyHeight = innerHeight - 2 * ellipseRy;

  // Altezza del riempimento in base alla percentuale
  const fillHeight = bodyHeight * fillPercent;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Ellipse
        cx={width / 2}
        cy={padding + ellipseRy}
        rx={ellipseRx}
        ry={ellipseRy}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
      />

      <Line
        x1={padding + strokeWidth / 2}
        y1={padding + ellipseRy}
        x2={padding + strokeWidth / 2}
        y2={padding + ellipseRy + bodyHeight}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      <Line
        x1={width - padding - strokeWidth / 2}
        y1={padding + ellipseRy}
        x2={width - padding - strokeWidth / 2}
        y2={padding + ellipseRy + bodyHeight}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />

      <Ellipse
        cx={width / 2}
        cy={padding + ellipseRy + bodyHeight}
        rx={ellipseRx}
        ry={ellipseRy}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill={color}
      />

      <Defs>
        <ClipPath id="clipBody">
          <Rect
            x={padding + strokeWidth / 2}
            y={padding + ellipseRy + (bodyHeight - fillHeight)}
            width={innerWidth - strokeWidth}
            height={fillHeight}
          />
        </ClipPath>
      </Defs>

      <Rect
        x={padding + strokeWidth / 2}
        y={padding + ellipseRy}
        width={innerWidth - strokeWidth}
        height={bodyHeight}
        fill={color}
        clipPath="url(#clipBody)"
      />
    </Svg>
  );
};

export default Cylinder;
