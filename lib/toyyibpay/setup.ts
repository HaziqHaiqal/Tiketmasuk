import { ToyyibPayCategory } from './types';
import { TOYYIBPAY_API_URL, TOYYIBPAY_ENDPOINTS } from './config';

/**
 * ToyyibPay Setup Utilities
 * For initial configuration and category management
 */
export class ToyyibPaySetup {
  private userSecretKey: string;

  constructor() {
    this.userSecretKey = process.env.TOYYIBPAY_SECRET_KEY || '';
    
    if (!this.userSecretKey) {
      throw new Error('TOYYIBPAY_SECRET_KEY is missing in environment variables. Please add it to your .env.local file.');
    }
  }

  /**
   * Create a new category
   */
  async createCategory(categoryName: string, categoryDescription: string): Promise<string> {
    const categoryData: ToyyibPayCategory = {
      catname: categoryName,
      catdescription: categoryDescription,
      userSecretKey: this.userSecretKey,
    };

    try {
      const response = await fetch(`${TOYYIBPAY_API_URL}${TOYYIBPAY_ENDPOINTS.createCategory}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          catname: categoryData.catname,
          catdescription: categoryData.catdescription,
          userSecretKey: categoryData.userSecretKey,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`ToyyibPay API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (Array.isArray(result) && result[0]?.CategoryCode) {
        return result[0].CategoryCode;
      } else {
        throw new Error(`ToyyibPay category creation failed: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error('Error creating ToyyibPay category:', error);
      throw error;
    }
  }



  /**
   * Get configuration status
   */
  static getConfigStatus() {
    const secretKey = process.env.TOYYIBPAY_SECRET_KEY;
    const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE;
    const sandbox = process.env.TOYYIBPAY_SANDBOX;

    return {
      secretKey: !!secretKey,
      categoryCode: !!categoryCode,
      sandbox: sandbox === 'true',
      isConfigured: !!secretKey && !!categoryCode,
    };
  }
}

/**
 * Get setup instructions
 */
export function getSetupInstructions(): string {
  return `
ToyyibPay Setup Instructions:

1. Create a ToyyibPay account:
   - For testing: https://dev.toyyibpay.com
   - For production: https://toyyibpay.com

2. Get your User Secret Key from your ToyyibPay dashboard

3. Create a category for your events or use the setup utility

4. Add these environment variables to your .env.local file:
   TOYYIBPAY_SECRET_KEY=your_user_secret_key_here
   TOYYIBPAY_CATEGORY_CODE=your_category_code_here
   TOYYIBPAY_SANDBOX=true

5. Restart your development server

For more information, visit: https://toyyibpay.com/apireference/
`;
}

/**
 * Quick setup helper for common scenarios
 */
export async function quickSetup(categoryName: string = 'Event Tickets'): Promise<string> {
  const setup = new ToyyibPaySetup();
  
  try {
    const categoryCode = await setup.createCategory(
      categoryName,
      `Category for ${categoryName} sales via ToyyibPay`
    );
    
    console.log(`
✅ Category created successfully!

Add this to your .env.local file:
TOYYIBPAY_CATEGORY_CODE=${categoryCode}

Then restart your development server.
    `);
    
    return categoryCode;
  } catch (error) {
    console.error('Quick setup failed:', error);
    throw error;
  }
}

/**
 * Setup ToyyibPay category
 * This should be run once to create the category
 */
export async function setupToyyibPayCategory() {
  try {
    const response = await fetch('https://toyyibpay.com/index.php/api/createCategory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        userSecretKey: process.env.TOYYIBPAY_SECRET_KEY || '',
        catname: 'Event Tickets',
        catdescription: 'Event ticket sales and bookings',
      }).toString(),
    });

    const result = await response.text();
    console.log('Category creation result:', result);
    return result;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

 