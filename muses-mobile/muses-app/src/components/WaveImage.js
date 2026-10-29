import React from 'react';
import Svg, { ClipPath, Defs, Path, Image as SvgImage } from 'react-native-svg';

// Ảnh hero cắt theo hình sóng như trong Figma. Chỉnh path `d` để đổi đường cong.
export default function WaveImage({ source, width, height }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 290 440">
      <Defs>
        <ClipPath id="wave">
          <Path d="M10 0 L290 0 L290 432 C240 410 200 340 150 330 C90 325 30 340 25 300 C15 220 40 120 10 0 Z" />
        </ClipPath>
      </Defs>
      <SvgImage
        href={source}
        x="0"
        y="0"
        width="290"
        height="440"
        preserveAspectRatio="xMidYMid slice"
        clipPath="url(#wave)"
      />
    </Svg>
  );
}
