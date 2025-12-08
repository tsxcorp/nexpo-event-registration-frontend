#!/bin/bash

# Script to fix badge_custom_content parsing in backend

echo "🔧 FIXING badge_custom_content PARSING IN BACKEND"
echo "═══════════════════════════════════════════════════════════════"

BACKEND_FILE="../nexpo-event-registration-backend/src/utils/zohoEventUtilsREST.js"

echo ""
echo "📍 Target file: $BACKEND_FILE"
echo ""

# Backup original file
echo "📦 Creating backup..."
cp "$BACKEND_FILE" "${BACKEND_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created: ${BACKEND_FILE}.backup.$(date +%Y%m%d_%H%M%S)"

echo ""
echo "🔍 Current parseBadgeCustomContent function:"
echo "─────────────────────────────────────────────────────────────"
grep -A 15 "^const parseBadgeCustomContent" "$BACKEND_FILE"

echo ""
echo "─────────────────────────────────────────────────────────────"
echo ""
echo "💡 RECOMMENDED FIX:"
echo ""
echo "Replace the parseBadgeCustomContent function with:"
echo ""
cat << 'EOF'
const parseBadgeCustomContent = (badgeContent) => {
  // Return the raw string value, don't parse it
  // Frontend will handle the field extraction
  if (!badgeContent) return "";  // Return empty string instead of {}
  
  // If it's already a string, return as is (trimmed)
  if (typeof badgeContent === 'string') {
    return badgeContent.trim();
  }
  
  // If it's an object, try to stringify it
  if (typeof badgeContent === 'object') {
    try {
      // If it's an empty object, return empty string
      if (Object.keys(badgeContent).length === 0) {
        return "";
      }
      return JSON.stringify(badgeContent);
    } catch (error) {
      console.error('Error stringifying badge_custom_content:', error);
      return "";
    }
  }
  
  // Convert to string for other types
  return String(badgeContent);
};
EOF

echo ""
echo "─────────────────────────────────────────────────────────────"
echo ""
echo "🎯 MANUAL STEPS:"
echo ""
echo "1. Open file: $BACKEND_FILE"
echo "2. Find function: parseBadgeCustomContent"
echo "3. Replace with the code above"
echo "4. Save file"
echo "5. Restart backend server: npm start"
echo "6. Test with: curl http://localhost:3000/api/events?eventId=4433256000016888003"
echo ""
echo "✅ Expected result after fix:"
echo '   "badge_custom_content": "Tên Công Ty,company_name"  (string)'
echo ""
echo "❌ Current result:"
echo '   "badge_custom_content": {}  (empty object)'
echo ""
echo "═══════════════════════════════════════════════════════════════"
