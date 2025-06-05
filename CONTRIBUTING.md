# Contributing to Interspace

Thank you for your interest in contributing to Interspace! This document provides guidelines and instructions for contributing to the project.

## 🤝 Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature/fix
4. Make your changes
5. Test thoroughly
6. Submit a pull request

## 📋 Development Guidelines

### Code Style

- Follow the existing code style and patterns
- Use TypeScript for all new code
- Ensure proper type definitions
- Use meaningful variable and function names

### Component Guidelines

- Keep components small and focused
- Use functional components with hooks
- Follow the established file structure
- Document complex logic with comments

### Naming Conventions

- **Components**: PascalCase (e.g., `ProfileSelector.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useProfiles.ts`)
- **Utils**: camelCase (e.g., `hapticFeedback.ts`)
- **Types**: PascalCase for interfaces/types

### File Structure

When adding new features, follow the existing structure:
- Components go in `src/components/[feature]/`
- Hooks go in `src/hooks/`
- Services go in `src/services/`
- Types go in `src/types/`
- Utils go in `src/utils/`

## 🧪 Testing

Before submitting:
1. Test on both iOS and Android
2. Verify no TypeScript errors
3. Check for console warnings
4. Test with different wallet types
5. Verify transaction flows work correctly

## 📝 Commit Messages

Follow conventional commit format:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process/auxiliary tool changes

Example: `feat: add folder sharing functionality`

## 🔄 Pull Request Process

1. Update documentation if needed
2. Add/update tests as appropriate
3. Ensure CI passes
4. Request review from maintainers
5. Address review feedback promptly

### PR Title Format
Use clear, descriptive titles following the commit message format.

### PR Description
Include:
- What changes were made
- Why the changes were necessary
- How to test the changes
- Screenshots for UI changes

## 🐛 Reporting Issues

When reporting issues, include:
- Device type and OS version
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or error logs
- Wallet types involved

## 💡 Feature Requests

We welcome feature suggestions! Please:
- Check existing issues first
- Provide clear use cases
- Explain the benefit to users
- Consider implementation complexity

## 🔐 Security

- Never commit sensitive data
- Report security issues privately
- Follow secure coding practices
- Be cautious with wallet interactions

## 📚 Resources

- [React Native Documentation](https://reactnative.dev)
- [Thirdweb Documentation](https://portal.thirdweb.com)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## ❓ Questions?

Feel free to:
- Open a discussion issue
- Reach out to maintainers
- Check existing documentation

Thank you for contributing to Interspace! 🚀
