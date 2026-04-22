// Copyright 2026 Yicong Lin
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     https://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}", 
    "./components/**/*.{js,jsx,ts,tsx}", 
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'aily-bg': '#FFFFFF',
        'aily-primary': '#1A1A1A',
        'aily-secondary': '#595959',
        'aily-blue': '#1565C0',
        'aily-red': '#D32F2F',
        'aily-green': '#2E7D32',
      },
      fontSize: {
        'aily-h1': '2rem',
        'aily-h2': '1.5rem',
        'aily-action': '1.375rem',
        'aily-body-lg': '1.25rem',
        'aily-body-sm': '1.125rem',
      },
      fontFamily: {
        'atkinson': ['AtkinsonHyperlegible_400Regular'],
        'atkinson-bold': ['AtkinsonHyperlegible_700Bold'],
      },
      letterSpacing: {
        'tightest': '0.03em',
      }
    },
  },
  plugins: [],
}

