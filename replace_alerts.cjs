const fs = require('fs');
const path = require('path');

const components = [
    'UserDashboard.tsx',
    'PropertyDetailModal.tsx',
    'PostPropertyPage.tsx',
    'EditPropertyModal.tsx',
    'AdminDashboard.tsx'
];

components.forEach(file => {
    const filePath = path.join(__dirname, 'src/app/components', file);
    let content = fs.readFileSync(filePath, 'utf-8');

    // Add import { toast } from 'sonner'; if not present
    if (!content.includes("import { toast } from 'sonner';")) {
        // Find the last import statement
        const lastImportIndex = content.lastIndexOf('import ');
        const endOfLastImport = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, endOfLastImport + 1) + "import { toast } from 'sonner';\n" + content.slice(endOfLastImport + 1);
    }

    // Replace alert('...') with toast.error or toast.success
    // We'll use a simple regex but be careful about success messages
    content = content.replace(/alert\((['"`])([^'"`]*thành công[^'"`]*)(['"`])\)/g, "toast.success($1$2$3)");
    content = content.replace(/alert\((['"`])([^'"`]+)(['"`])\)/g, "toast.error($1$2$3)"); // Assume others are errors or warnings
    content = content.replace(/alert\(([^)]+)\)/g, "toast.error($1)"); // Fallback for dynamic strings

    fs.writeFileSync(filePath, content, 'utf-8');
});
console.log('Replaced alerts in components');
