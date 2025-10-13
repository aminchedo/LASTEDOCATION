# Contributing to Model Training Project

Thank you for considering contributing to the Model Training Project! This document provides guidelines and instructions for contributing.

---

## 🎯 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected vs actual behavior**
- **Environment details** (OS, Node version, Python version)
- **Screenshots** if applicable
- **Logs** from `BACKEND/logs/` or Docker logs

### Suggesting Enhancements

Enhancement suggestions are welcome! Please:

- **Use a clear title** for the issue
- **Provide detailed description** of the enhancement
- **Explain why** this enhancement would be useful
- **List similar features** in other projects if applicable

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
6. **Push to your fork**
7. **Open a Pull Request**

---

## 🔧 Development Setup

### Prerequisites

- Node.js 20+
- Python 3.10+
- Git

### Setup

```bash
# Clone your fork
git clone https://github.com/your-username/model-training-project.git
cd model-training-project

# Run setup script
./scripts/setup.sh

# Or manual setup
npm install
cd BACKEND && npm install && cd ..
cd client && npm install && cd ..
pip3 install -r requirements.txt

# Configure environment
cp BACKEND/.env.example BACKEND/.env
# Edit BACKEND/.env and set JWT_SECRET

# Start development
npm run dev
```

---

## 📝 Coding Standards

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Follow **ESLint** configuration
- Use **meaningful variable names**
- Add **JSDoc comments** for functions
- Keep functions **small and focused**
- Use **async/await** instead of callbacks

**Example:**

```typescript
/**
 * Validates a dataset file format
 * @param filePath - Path to the dataset file
 * @returns Validation result with errors if any
 */
async function validateDataset(filePath: string): Promise<ValidationResult> {
  // Implementation
}
```

### Python

- Follow **PEP 8** style guide
- Use **type hints** for function parameters and returns
- Add **docstrings** for classes and functions
- Use **meaningful variable names**
- Keep functions **single-purpose**

**Example:**

```python
def train_model(
    model_name: str,
    dataset_path: str,
    epochs: int = 3,
    batch_size: int = 4
) -> str:
    """
    Train a model with the given configuration.
    
    Args:
        model_name: Name of the base model
        dataset_path: Path to training dataset
        epochs: Number of training epochs
        batch_size: Training batch size
    
    Returns:
        Path to the trained model
    """
    # Implementation
```

### React/UI

- Use **functional components** with hooks
- Follow **React best practices**
- Keep components **small and reusable**
- Use **TypeScript** for prop types
- Add **proper error boundaries**
- Ensure **RTL support** for Persian text

**Example:**

```typescript
interface ProgressCardProps {
  progress: number;
  status: TrainingStatus;
  onStop: () => void;
}

export function ProgressCard({ progress, status, onStop }: ProgressCardProps) {
  // Implementation
}
```

---

## 🧪 Testing

### Running Tests

```bash
# Backend tests
cd BACKEND
npm test
npm run test:watch
npm run test:coverage

# Frontend tests
cd client
npm test
```

### Writing Tests

- Write tests for **all new features**
- Ensure **existing tests pass**
- Aim for **70%+ code coverage**
- Test **edge cases and error conditions**
- Use **descriptive test names**

**Example:**

```typescript
describe('Training Service', () => {
  it('should start training with valid config', async () => {
    const config = {
      modelName: 'test-model',
      epochs: 1,
      batchSize: 4,
      learningRate: 0.001
    };
    
    const result = await startTraining(config);
    
    expect(result.ok).toBe(true);
    expect(result.data.runId).toBeDefined();
  });
  
  it('should reject training with invalid config', async () => {
    const invalidConfig = {
      modelName: '',
      epochs: -1
    };
    
    await expect(startTraining(invalidConfig)).rejects.toThrow();
  });
});
```

---

## 📚 Documentation

### Updating Documentation

When making changes:

1. **Update relevant markdown files**
2. **Add inline code comments**
3. **Update API documentation**
4. **Add usage examples**

### Documentation Files

- `README.md` - Project overview
- `QUICK_SETUP_GUIDE.md` - Setup instructions
- `DEPLOYMENT_GUIDE.md` - Deployment guide
- `BACKEND/API_ENDPOINTS.md` - API reference
- `FUNCTIONAL_COMPONENTS_CHECKLIST.md` - Component status

---

## 🔀 Git Workflow

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/update-description` - Documentation updates
- `refactor/component-name` - Code refactoring
- `test/test-description` - Test additions

### Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

**Examples:**

```bash
feat(training): add real PyTorch training script

Replaces simulation-based training with actual PyTorch implementation.
Includes progress callbacks and metrics tracking.

Closes #123
```

```bash
fix(api): correct dataset validation error handling

Fixed issue where validation errors were not properly reported to the client.
Added more detailed error messages and status codes.
```

---

## 🎨 UI/UX Guidelines

### Design Principles

- **Glassmorphism** - Maintain the glassmorphic design language
- **RTL Support** - Ensure all text and layouts work with RTL
- **Responsive** - Test on mobile, tablet, and desktop
- **Accessibility** - Use semantic HTML and ARIA labels
- **Persian Language** - All UI text should support Persian

### Adding New Pages

1. Create component in `client/src/pages/`
2. Add route in router configuration
3. Add navigation link if needed
4. Ensure RTL layout works correctly
5. Test responsiveness

---

## 🚀 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for new features (backwards compatible)
- **PATCH** version for bug fixes

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version bumped in `package.json`
- [ ] Git tag created
- [ ] Docker images built and tagged

---

## 📋 Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] No merge conflicts
- [ ] Branch is up to date with main
- [ ] Screenshots added for UI changes
- [ ] Performance impact considered

---

## 🤝 Code Review Process

### For Contributors

- Be **open to feedback**
- Respond to **review comments**
- Make requested **changes promptly**
- Be **respectful and professional**

### For Reviewers

- Be **constructive and helpful**
- Focus on **code quality** and **best practices**
- Check for **test coverage**
- Verify **documentation** is updated
- Test the **changes locally**

---

## 🐛 Debugging Tips

### Backend Debugging

```bash
# Enable debug logging
cd BACKEND
LOG_LEVEL=debug npm run dev

# Check logs
tail -f logs/api.log
```

### Frontend Debugging

```bash
# React DevTools
# Install browser extension

# Check console
# Open browser DevTools (F12)
```

### Docker Debugging

```bash
# View logs
docker-compose logs -f

# Enter container
docker exec -it model-training-backend sh

# Check health
docker inspect model-training-backend | grep Health
```

---

## 📞 Getting Help

### Resources

- **Documentation**: See `DOCUMENTATION_INDEX.md`
- **Issues**: Check existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions

### Contact

- Create an issue for bugs
- Start a discussion for questions
- Tag maintainers for urgent issues

---

## 🏆 Recognition

Contributors will be:

- Listed in `CONTRIBUTORS.md`
- Credited in release notes
- Mentioned in documentation

---

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🎉 Thank You!

Your contributions make this project better. Thank you for taking the time to contribute!

---

**Happy Coding! 🚀**
