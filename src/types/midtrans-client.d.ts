declare module 'midtrans-client' {
  export = midtrans;

  namespace midtrans {
    class Snap {
      constructor(config: {
        isProduction: boolean;
        serverKey: string;
        clientKey: string
      });

      createTransaction(params: {
        transaction_details: {
          order_id: string;
          gross_amount: number;
        };
        [key: string]: any;
      }): Promise<{ token: string; redirect_url: string }>;
    }

    class CoreApi {
      constructor(config: {
        isProduction: boolean;
        serverKey: string;
        clientKey: string;
      });

      charge(params: {
        payment_type: string;
        transaction_details: {
          order_id: string;
          gross_amount: number;
        };
        [key: string]: any;
      }): Promise<any>;

      transaction: {
        status(orderId: string): Promise<any>;
        expire(orderId: string): Promise<any>;
        cancel(orderId: string): Promise<any>;
      };
    }
  }
}