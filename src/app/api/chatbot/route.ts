import { NextResponse } from 'next/server';
import { queryDWH } from '@/lib/dwh-db';
import { generateWithRetry } from '@/lib/cohere';

// Type definitions for query results
interface CustomerResult {
  customerid: string;
  firstname: string;
  lastname: string;
  customernature: string;
  agencyname: string;
  segmentname: string;
}

interface AccountResult {
  accountid: string;
  accounttypedescription: string;
  currencycode: string;
  state: string;
  firstname: string;
  lastname: string;
}

interface TransactionResult {
  transactionidentifier: string;
  transactionamount: number;
  transactiontype: string;
  transactiondate: Date;
  firstname: string;
  lastname: string;
}

interface AgencyResult {
  agencyid: string;
  agencyname: string;
  zone: string;
  employeecount: number;
}

interface EmployeeResult {
  employeeid: string;
  employeename: string;
  function: string;
  role: string;
  agencyname: string;
}

interface ProductResult {
  productid: string;
  productname: string;
  producttype: string;
  subscriptioncount: number;
}

interface CreditResult {
  creditnumber: string;
  approvedamount: number;
  durationmonths: number;
  creditcategory: string;
  firstname: string;
  lastname: string;
}

interface ResourceResult {
  accountid: string;
  currentresources: number;
  previousmonthresources: number;
  firstname: string;
  lastname: string;
}

interface ObjectiveResult {
  employeeid: string;
  employeename: string;
  targetaccountopenings: number;
  targetresourcegrowth: number;
  agencyname: string;
}

interface ActivityResult {
  customerid: string;
  firstname: string;
  lastname: string;
  agencyvisits: number;
  digitalconnections: number;
  mobileappinteractions: number;
}

// Keyword mapping for the DWH_AMENBANK schema with related tables
const keywordMap: { [key: string]: string[] } = {
  'customer': ['dim_customer', 'fact_customer_activity', 'dim_account', 'fact_credit_details'],
  'customers': ['dim_customer', 'fact_customer_activity', 'dim_account', 'fact_credit_details'],
  'account': ['dim_account', 'fact_resources', 'fact_transaction', 'fact_product_subscription'],
  'accounts': ['dim_account', 'fact_resources', 'fact_transaction', 'fact_product_subscription'],
  'transaction': ['fact_transaction', 'dim_account', 'dim_customer', 'dim_agency'],
  'transactions': ['fact_transaction', 'dim_account', 'dim_customer', 'dim_agency'],
  'agency': ['dim_agency', 'dim_employee', 'dim_account', 'fact_objectives'],
  'agencies': ['dim_agency', 'dim_employee', 'dim_account', 'fact_objectives'],
  'Zone': ['dim_agency', 'dim_employee', 'dim_account', 'fact_objectives'],
  'employee': ['dim_employee', 'fact_objectives', 'dim_agency'],
  'employees': ['dim_employee', 'fact_objectives', 'dim_agency'],
  'product': ['dim_product', 'fact_product_subscription', 'fact_credit_details'],
  'products': ['dim_product', 'fact_product_subscription', 'fact_credit_details'],
  'credit': ['fact_credit_details', 'dim_customer', 'dim_product'],
  'credits': ['fact_credit_details', 'dim_customer', 'dim_product'],
  'resource': ['fact_resources', 'dim_account', 'dim_customer'],
  'resources': ['fact_resources', 'dim_account', 'dim_customer'],
  'objective': ['fact_objectives', 'dim_employee', 'dim_agency'],
  'objectives': ['fact_objectives', 'dim_employee', 'dim_agency'],
  'activity': ['fact_customer_activity', 'dim_customer', 'dim_agency'],
  'activities': ['fact_customer_activity', 'dim_customer', 'dim_agency'],
};

// Store conversation context
const conversationContext = new Map<string, any>();

export async function POST(request: Request) {
  try {
    // Check if Cohere API key is set
    if (!process.env.COHERE_API_KEY) {
      console.error('COHERE_API_KEY is not defined in environment variables');
      return NextResponse.json({
        response: "I'm sorry, but I'm currently unable to process your request due to a configuration issue. Please try again later."
      }, { status: 500 });
    }

    // Parse request body
    let message: string;
    let sessionId: string;
    try {
      const body = await request.json();
      message = body.message;
      sessionId = body.sessionId;
      if (!message || !sessionId) {
        throw new Error('Missing required fields in request body');
      }
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({
        response: "Invalid request format. Please try again."
      }, { status: 400 });
    }

    const lowerMessage = message.toLowerCase();
    console.log('Processing message:', message);

    // Get or create conversation context
    const context = conversationContext.get(sessionId) || {};
    conversationContext.set(sessionId, context);

    // Extract keywords from the message
    const keywords = Object.keys(keywordMap).filter(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    console.log('Extracted keywords:', keywords);

    if (keywords.length === 0) {
      return NextResponse.json({
        response: "I can help you with information about:\n" +
          "• Customers (e.g., 'Tell me about the customer with the id C034114' or 'How many customers do we have?')\n" +
          "• Accounts (e.g., 'Which agency has the most accounts?')\n" +
          "• Transactions (e.g., 'Show me recent transactions')\n" +
          "• Agencies (e.g., 'List all agencies')\n" +
          "• Products (e.g., 'What are our top products?')\n" +
          "• Credits (e.g., 'Show me recent credit approvals')\n" +
          "What would you like to know?"
      });
    }

    // Get all relevant tables for the keywords
    const relevantTables = new Set<string>();
    keywords.forEach(keyword => {
      keywordMap[keyword].forEach(table => relevantTables.add(table));
    });
    console.log('Relevant tables:', Array.from(relevantTables));

    // Fetch data from all relevant tables
    const allData: { [key: string]: any[] } = {};
    let hasData = false;
    let dbError: Error | null = null;

    for (const table of relevantTables) {
      try {
        console.log(`Fetching data from ${table}...`);
        const query = `SELECT * FROM public.${table} LIMIT 50`; // Reduced limit 
        const result = await queryDWH(query);
        if (result && result.length > 0) {
          // Truncate long text fields and remove unnecessary data
          const processedResult = result.map((row: any) => {
            const processedRow: any = {};
            for (const [key, value] of Object.entries(row)) {
              if (typeof value === 'string' && value.length > 100) {
                processedRow[key] = value.substring(0, 100) + '...';
              } else {
                processedRow[key] = value;
              }
            }
            return processedRow;
          });
          allData[table] = processedResult;
          hasData = true;
          console.log(`Successfully fetched ${result.length} rows from ${table}`);
        } else {
          console.log(`No data found in table ${table}`);
        }
      } catch (error) {
        dbError = error as Error;
        console.error(`Error fetching data from ${table}:`, {
          error: dbError.message,
          stack: dbError.stack,
          table
        });
      }
    }

    // Check if we got any data
    if (!hasData) {
      const errorMessage = dbError 
        ? `Database error: ${dbError.message}`
        : 'No data was fetched from any table';
      console.error(errorMessage);
      return NextResponse.json({
        response: `I'm sorry, I couldn't retrieve the necessary data: ${errorMessage}. Please try again.`
      }, { status: 500 });
    }

    // prompt for Cohere
    const prompt = `You are a banking assistant at Amen Bank. Your role is to help staff understand banking data in a clear, precise short way. Given the following data, please answer this question: "${message}"

Available data summary:
${Object.entries(allData).map(([table, rows]) => 
  `${table}: ${rows.length} rows with fields: ${Object.keys(rows[0]).join(', ')}`
).join('\n')}

Sample data (metrics):
might not be related to query , but it's here for context: 19K total accounts, 10K total customers, 100K total transactions, 20K total agencies, 54K total products

Please provide a brief precise response:
1. Directly answers the question in simple terms
2. Uses natural, everyday language
3. Includes relevant numbers and statistics
4. Avoids technical jargon unless necessary
5. Makes the information easy to understand
6. Keeps the response concise and focused

Remember: You're talking to a bank staff member, so be professional but friendly. Use bullet points for better readability, and focus on the most important information first and don't mention sql table names.

Response:`;

    try {
      console.log('Sending request to Cohere API...');
      const cohereResponse = await generateWithRetry(prompt);
      const response = cohereResponse.generations[0].text;
      console.log('Received response from Cohere API');
      return NextResponse.json({ response });
    } catch (error) {
      const cohereError = error as Error;
      console.error('Cohere API error:', {
        message: cohereError.message,
        stack: cohereError.stack
      });
      
      // Provide a more user-friendly error message for rate limits
      if (cohereError.message?.includes('429')) {
        return NextResponse.json({
          response: "I'm currently experiencing high demand. Please try again in a few moments."
        }, { status: 429 });
      }
      
      return NextResponse.json({
        response: `I'm sorry, I encountered an error while analyzing the data: ${cohereError.message}. Please try again.`
      }, { status: 500 });
    }

  } catch (error) {
    const generalError = error as Error;
    console.error('Chatbot error:', {
      message: generalError.message,
      stack: generalError.stack
    });
    return NextResponse.json({
      response: `I'm sorry, I encountered an error: ${generalError.message}. Please try again.`
    }, { status: 500 });
  }
}
