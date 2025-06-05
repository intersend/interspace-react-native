import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

interface ProfileAvatarProps {
  address: string;
  size?: number;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ address, size = 120 }) => {
  const pixels = useMemo(() => {
    // Generate a 5x5 grid with symmetry from the address
    const grid: boolean[][] = [];
    const hash = address.toLowerCase().replace('0x', '');
    
    // Create 5x5 grid
    for (let y = 0; y < 5; y++) {
      grid[y] = [];
      for (let x = 0; x < 3; x++) { // Only need first 3 columns (will mirror)
        const index = y * 3 + x;
        const charCode = hash.charCodeAt(index % hash.length);
        grid[y][x] = charCode % 2 === 0;
      }
    }
    
    // Mirror for symmetry
    for (let y = 0; y < 5; y++) {
      grid[y][3] = grid[y][1];
      grid[y][4] = grid[y][0];
    }
    
    return grid;
  }, [address]);
  
  const colors = useMemo(() => {
    // Generate colors from address
    const hash = address.toLowerCase().replace('0x', '');
    const r = parseInt(hash.substr(0, 2), 16);
    const g = parseInt(hash.substr(2, 2), 16);
    const b = parseInt(hash.substr(4, 2), 16);
    
    // Brighten colors for dark mode
    const brighten = (val: number) => Math.min(255, val + 80);
    
    return {
      primary: `rgb(${brighten(r)}, ${brighten(g)}, ${brighten(b)})`,
      background: '#2C2C2E', // Dark mode background
    };
  }, [address]);
  
  const pixelSize = size / 5;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={[styles.avatar, { width: size, height: size }]}>
        {pixels.map((row, y) => (
          <View key={y} style={styles.row}>
            {row.map((filled, x) => (
              <View
                key={`${y}-${x}`}
                style={[
                  styles.pixel,
                  {
                    width: pixelSize,
                    height: pixelSize,
                    backgroundColor: filled ? colors.primary : colors.background,
                  },
                ]}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#2C2C2E',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatar: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  pixel: {
    // Size set dynamically
  },
});

export default ProfileAvatar;
