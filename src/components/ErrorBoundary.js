import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from './theme';

/**
 * React error boundary to prevent full app crashes from unexpected render/runtime errors.
 * Used to wrap major navigation screens.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, err };
  }

  componentDidCatch(err) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', err);
  }

  render() {
    const { hasError, err } = this.state;
    const { fallback } = this.props;

    if (hasError) {
      if (typeof fallback === 'function') {
        return fallback({ error: err });
      }
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.sub}>
            Please try again. {err?.message ? `(${String(err.message).slice(0, 80)})` : ''}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg, padding: 16, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  sub: { fontSize: 13, color: COLORS.muted, lineHeight: 18 },
});

