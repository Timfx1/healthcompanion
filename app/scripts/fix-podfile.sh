#!/bin/bash

# Add use_modular_headers! to Podfile for AppCheckCore compatibility
# This fixes: "The Swift pod `AppCheckCore` depends upon `GoogleUtilities` and `RecaptchaInterop`, 
# which do not define modules."

PODFILE="ios/Podfile"

# Check if use_modular_headers! already exists
if grep -q "use_modular_headers!" "$PODFILE"; then
  echo "use_modular_headers! already present in Podfile"
  exit 0
fi

# Add use_modular_headers! after target 'Healthcompanion' line
sed -i '' "/target 'Healthcompanion' do/a\\
  use_modular_headers!
" "$PODFILE"

echo "✓ Added use_modular_headers! to Podfile"
