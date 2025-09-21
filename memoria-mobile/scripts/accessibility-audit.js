#!/usr/bin/env node

/**
 * Accessibility Audit Script for Memoria.ai
 * Automated accessibility testing focused on elderly user requirements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration for elderly user-focused accessibility testing
const ELDERLY_USER_CONFIG = {
  minimumTouchTarget: 60, // pixels
  minimumFontSize: 18, // pixels
  minimumContrastRatio: 4.5, // WCAG AA
  maximumCognitiveLoad: 4, // max primary actions per screen
  targetPerformance: {
    launchTime: 3000, // milliseconds
    memoryUsage: 100, // MB
    touchResponseTime: 100 // milliseconds
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

class AccessibilityAuditor {
  constructor() {
    this.results = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: []
    };
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logSection(title) {
    this.log(`\n${'='.repeat(60)}`, 'blue');
    this.log(`  ${title}`, 'blue');
    this.log(`${'='.repeat(60)}`, 'blue');
  }

  addResult(test, status, message, severity = 'error') {
    this.results.totalTests++;

    const result = {
      test,
      status,
      message,
      severity,
      timestamp: new Date().toISOString()
    };

    if (status === 'pass') {
      this.results.passed++;
      this.log(`✓ ${test}`, 'green');
    } else if (status === 'fail') {
      this.results.failed++;
      this.log(`✗ ${test}: ${message}`, 'red');
      this.results.issues.push(result);
    } else if (status === 'warning') {
      this.results.warnings++;
      this.log(`⚠ ${test}: ${message}`, 'yellow');
      this.results.issues.push(result);
    }
  }

  // Test Touch Target Sizes
  async testTouchTargets() {
    this.logSection('Touch Target Size Testing');

    try {
      const componentFiles = this.findComponentFiles();

      for (const file of componentFiles) {
        const content = fs.readFileSync(file, 'utf8');

        // Look for style definitions that might indicate touch targets
        const styleMatches = content.match(/style\s*=\s*{[^}]+}/g) || [];
        const styleSheetMatches = content.match(/StyleSheet\.create\({[\s\S]*?}\)/g) || [];

        let hasTouchTargetIssues = false;

        // Check for hardcoded small dimensions
        const smallDimensionRegex = /(width|height|minWidth|minHeight):\s*([1-5]?\d)(?![\d.])/g;
        let match;

        while ((match = smallDimensionRegex.exec(content)) !== null) {
          const dimension = parseInt(match[2]);
          if (dimension < ELDERLY_USER_CONFIG.minimumTouchTarget && dimension > 10) {
            hasTouchTargetIssues = true;
            this.addResult(
              `Touch target in ${path.basename(file)}`,
              'fail',
              `Found ${match[1]}: ${dimension}px (minimum: ${ELDERLY_USER_CONFIG.minimumTouchTarget}px)`
            );
          }
        }

        if (!hasTouchTargetIssues) {
          this.addResult(
            `Touch targets in ${path.basename(file)}`,
            'pass',
            'All touch targets meet elderly user requirements'
          );
        }
      }
    } catch (error) {
      this.addResult(
        'Touch target analysis',
        'fail',
        `Failed to analyze touch targets: ${error.message}`
      );
    }
  }

  // Test Font Sizes
  async testFontSizes() {
    this.logSection('Font Size Testing');

    try {
      const componentFiles = this.findComponentFiles();

      for (const file of componentFiles) {
        const content = fs.readFileSync(file, 'utf8');

        // Look for fontSize declarations
        const fontSizeRegex = /fontSize:\s*(\d+)/g;
        let match;
        let hasSmallFonts = false;

        while ((match = fontSizeRegex.exec(content)) !== null) {
          const fontSize = parseInt(match[1]);
          if (fontSize < ELDERLY_USER_CONFIG.minimumFontSize) {
            hasSmallFonts = true;
            this.addResult(
              `Font size in ${path.basename(file)}`,
              'fail',
              `Found fontSize: ${fontSize}px (minimum: ${ELDERLY_USER_CONFIG.minimumFontSize}px)`
            );
          }
        }

        if (!hasSmallFonts) {
          this.addResult(
            `Font sizes in ${path.basename(file)}`,
            'pass',
            'All font sizes meet elderly user requirements'
          );
        }
      }
    } catch (error) {
      this.addResult(
        'Font size analysis',
        'fail',
        `Failed to analyze font sizes: ${error.message}`
      );
    }
  }

  // Test Accessibility Props
  async testAccessibilityProps() {
    this.logSection('Accessibility Properties Testing');

    try {
      const componentFiles = this.findComponentFiles();

      for (const file of componentFiles) {
        const content = fs.readFileSync(file, 'utf8');

        // Check for TouchableOpacity/Pressable without accessibility props
        const touchableRegex = /<(TouchableOpacity|Pressable|Button)[^>]*>/g;
        let match;

        while ((match = touchableRegex.exec(content)) !== null) {
          const element = match[0];

          // Check for required accessibility props
          const hasAccessibilityLabel = element.includes('accessibilityLabel');
          const hasAccessibilityRole = element.includes('accessibilityRole');
          const hasAccessible = element.includes('accessible');

          if (!hasAccessibilityLabel) {
            this.addResult(
              `Accessibility label in ${path.basename(file)}`,
              'fail',
              `${match[1]} missing accessibilityLabel prop`
            );
          }

          if (!hasAccessibilityRole && !hasAccessible) {
            this.addResult(
              `Accessibility role in ${path.basename(file)}`,
              'warning',
              `${match[1]} missing accessibilityRole or accessible prop`
            );
          }
        }

        // Check for images without alt text
        const imageRegex = /<Image[^>]*>/g;
        while ((match = imageRegex.exec(content)) !== null) {
          const element = match[0];

          if (!element.includes('accessibilityLabel') && !element.includes('accessible={false}')) {
            this.addResult(
              `Image accessibility in ${path.basename(file)}`,
              'fail',
              'Image missing accessibilityLabel prop'
            );
          }
        }
      }
    } catch (error) {
      this.addResult(
        'Accessibility props analysis',
        'fail',
        `Failed to analyze accessibility props: ${error.message}`
      );
    }
  }

  // Test Screen Reader Support
  async testScreenReaderSupport() {
    this.logSection('Screen Reader Support Testing');

    try {
      // Check for proper semantic structure
      const componentFiles = this.findComponentFiles();

      for (const file of componentFiles) {
        const content = fs.readFileSync(file, 'utf8');

        // Check for proper heading structure
        const hasHeading = content.includes('accessibilityRole="header"') ||
                          content.includes('accessibilityRole=\\"header\\"');

        if (content.includes('Screen') && !hasHeading) {
          this.addResult(
            `Screen heading in ${path.basename(file)}`,
            'warning',
            'Screen component should have a heading for screen readers'
          );
        }

        // Check for form labels
        const hasTextInput = content.includes('TextInput');
        const hasFormLabel = content.includes('accessibilityLabel') ||
                           content.includes('accessibilityLabelledBy');

        if (hasTextInput && !hasFormLabel) {
          this.addResult(
            `Form labeling in ${path.basename(file)}`,
            'fail',
            'TextInput missing accessibility label'
          );
        }
      }
    } catch (error) {
      this.addResult(
        'Screen reader support analysis',
        'fail',
        `Failed to analyze screen reader support: ${error.message}`
      );
    }
  }

  // Test Cognitive Load
  async testCognitiveLoad() {
    this.logSection('Cognitive Load Testing');

    try {
      const screenFiles = this.findScreenFiles();

      for (const file of screenFiles) {
        const content = fs.readFileSync(file, 'utf8');

        // Count primary action buttons
        const buttonMatches = content.match(/<(TouchableOpacity|Pressable|Button)[^>]*>/g) || [];
        const primaryButtons = buttonMatches.filter(button =>
          button.includes('variant="primary"') ||
          button.includes('variant=\\"primary\\"') ||
          !button.includes('variant=')
        );

        if (primaryButtons.length > ELDERLY_USER_CONFIG.maximumCognitiveLoad) {
          this.addResult(
            `Cognitive load in ${path.basename(file)}`,
            'fail',
            `Too many primary actions (${primaryButtons.length}, max: ${ELDERLY_USER_CONFIG.maximumCognitiveLoad})`
          );
        } else {
          this.addResult(
            `Cognitive load in ${path.basename(file)}`,
            'pass',
            `Cognitive load within acceptable range (${primaryButtons.length} primary actions)`
          );
        }
      }
    } catch (error) {
      this.addResult(
        'Cognitive load analysis',
        'fail',
        `Failed to analyze cognitive load: ${error.message}`
      );
    }
  }

  // Test Bilingual Support
  async testBilingualSupport() {
    this.logSection('Bilingual Support Testing');

    try {
      // Check for hardcoded English strings
      const componentFiles = this.findComponentFiles();
      const commonEnglishWords = ['Start', 'Record', 'Play', 'Save', 'Settings', 'Help', 'Back'];

      for (const file of componentFiles) {
        const content = fs.readFileSync(file, 'utf8');

        for (const word of commonEnglishWords) {
          const hardcodedRegex = new RegExp(`['"\`]${word}['"\`]`, 'g');
          if (hardcodedRegex.test(content)) {
            this.addResult(
              `Hardcoded text in ${path.basename(file)}`,
              'warning',
              `Found hardcoded English text: "${word}" - should use localization`
            );
          }
        }
      }

      // Check for Chinese character support
      const hasChineseSupport = this.checkForChineseSupport();
      if (hasChineseSupport) {
        this.addResult(
          'Chinese language support',
          'pass',
          'Chinese language support detected'
        );
      } else {
        this.addResult(
          'Chinese language support',
          'warning',
          'No Chinese language support detected'
        );
      }
    } catch (error) {
      this.addResult(
        'Bilingual support analysis',
        'fail',
        `Failed to analyze bilingual support: ${error.message}`
      );
    }
  }

  // Helper method to find component files
  findComponentFiles() {
    const srcDir = path.join(process.cwd(), 'src');
    const files = [];

    const findFiles = (dir) => {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          findFiles(fullPath);
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
          files.push(fullPath);
        }
      }
    };

    if (fs.existsSync(srcDir)) {
      findFiles(srcDir);
    }

    return files;
  }

  // Helper method to find screen files
  findScreenFiles() {
    const screensDir = path.join(process.cwd(), 'src', 'screens');
    const files = [];

    if (fs.existsSync(screensDir)) {
      const findFiles = (dir) => {
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            findFiles(fullPath);
          } else if (item.endsWith('.tsx')) {
            files.push(fullPath);
          }
        }
      };

      findFiles(screensDir);
    }

    return files;
  }

  // Helper method to check for Chinese support
  checkForChineseSupport() {
    const localeFiles = [
      'src/localization',
      'src/i18n',
      'assets/translations',
      'translations'
    ].map(p => path.join(process.cwd(), p));

    for (const dir of localeFiles) {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        if (files.some(f => f.includes('zh') || f.includes('chinese') || f.includes('cn'))) {
          return true;
        }
      }
    }

    return false;
  }

  // Run automated tests with Jest
  async runAutomatedTests() {
    this.logSection('Running Automated Accessibility Tests');

    try {
      const testResult = execSync('npm run test:accessibility', {
        encoding: 'utf8',
        timeout: 30000
      });

      this.addResult(
        'Automated accessibility tests',
        'pass',
        'All automated tests passed'
      );
    } catch (error) {
      this.addResult(
        'Automated accessibility tests',
        'fail',
        `Some automated tests failed: ${error.message}`
      );
    }
  }

  // Generate comprehensive report
  generateReport() {
    const duration = Date.now() - this.startTime;

    this.logSection('Accessibility Audit Report');

    // Summary
    this.log(`\nSUMMARY:`, 'magenta');
    this.log(`Total Tests: ${this.results.totalTests}`);
    this.log(`Passed: ${this.results.passed}`, 'green');
    this.log(`Failed: ${this.results.failed}`, 'red');
    this.log(`Warnings: ${this.results.warnings}`, 'yellow');
    this.log(`Duration: ${(duration / 1000).toFixed(2)}s`);

    // Issues breakdown
    if (this.results.issues.length > 0) {
      this.log(`\nISSUES FOUND:`, 'magenta');

      const critical = this.results.issues.filter(i => i.severity === 'error');
      const warnings = this.results.issues.filter(i => i.severity === 'warning');

      if (critical.length > 0) {
        this.log(`\nCritical Issues (${critical.length}):`, 'red');
        critical.forEach((issue, index) => {
          this.log(`${index + 1}. ${issue.test}: ${issue.message}`, 'red');
        });
      }

      if (warnings.length > 0) {
        this.log(`\nWarnings (${warnings.length}):`, 'yellow');
        warnings.forEach((issue, index) => {
          this.log(`${index + 1}. ${issue.test}: ${issue.message}`, 'yellow');
        });
      }
    }

    // Recommendations
    this.log(`\nRECOMMENDATIONS:`, 'magenta');
    if (this.results.failed > 0) {
      this.log('- Fix critical accessibility issues before release', 'red');
      this.log('- Review touch target sizes for elderly users', 'red');
      this.log('- Add missing accessibility labels and roles', 'red');
    }
    if (this.results.warnings > 0) {
      this.log('- Consider addressing warnings for better UX', 'yellow');
      this.log('- Implement comprehensive localization', 'yellow');
    }

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'accessibility-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      ...this.results,
      summary: {
        totalTests: this.results.totalTests,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        duration: duration,
        timestamp: new Date().toISOString()
      },
      config: ELDERLY_USER_CONFIG
    }, null, 2));

    this.log(`\nDetailed report saved to: ${reportPath}`, 'blue');

    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }

  // Main audit runner
  async runAudit() {
    this.log('🔍 Starting Accessibility Audit for Memoria.ai', 'blue');
    this.log('Focus: Elderly Users (65+) with WCAG 2.1 AA compliance\n', 'blue');

    await this.testTouchTargets();
    await this.testFontSizes();
    await this.testAccessibilityProps();
    await this.testScreenReaderSupport();
    await this.testCognitiveLoad();
    await this.testBilingualSupport();
    await this.runAutomatedTests();

    this.generateReport();
  }
}

// Run the audit
const auditor = new AccessibilityAuditor();
auditor.runAudit().catch(error => {
  console.error('Audit failed:', error);
  process.exit(1);
});