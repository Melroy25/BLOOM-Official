/**
 * components/animations/StaggerContainer.tsx
 * Coordinates staggered cascade entrances for screen sections.
 */

import React, { createContext, useContext } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';

interface StaggerContextType {
  baseDelay: number;
  interval: number;
}

const StaggerContext = createContext<StaggerContextType>({
  baseDelay: 0,
  interval: 60,
});

export const useStaggerContext = () => useContext(StaggerContext);

interface StaggerContainerProps {
  children: React.ReactNode;
  baseDelay?: number;
  interval?: number;
  style?: StyleProp<ViewStyle>;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  baseDelay = 0,
  interval = 60,
  style,
}) => {
  return (
    <StaggerContext.Provider value={{ baseDelay, interval }}>
      <View style={style}>{children}</View>
    </StaggerContext.Provider>
  );
};
