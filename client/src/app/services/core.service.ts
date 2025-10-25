import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import { Product } from '../interfaces/core.interface';

@Injectable({
  providedIn: 'root'
})
export class CoreService {
  private searchResultsSubject = new BehaviorSubject<Product[]>([]);
  private searchQuerySubject = new BehaviorSubject<string>("");

  constructor(private http: HttpClient) { }


  sendUserToAuthClient(){
    // send over client details to auth client. 
    const clientId = "Client"
    // Define the URL of your auth-client's login endpoint
    const authClientUrl = 'https://accounts.mysite.com/login';

    // Prepare the redirect URL with client details (client_id and any other parameters you need)
    const redirectUrl = `${authClientUrl}?client_id=${clientId}`;

    // Redirect the user to the auth-client for login
    window.location.href = redirectUrl;

  }

  search(query: string) {
    this.searchQuerySubject.next(query);

    this.http.get<Product[]>(`/assets/Sample Dataset/03.json`).pipe(
      map(response => {
        return response
      }),
      catchError(() => {
        return throwError(() => new Error('Failed to fetch search results'));
      })
    ).subscribe( (products: Product[]) => { 
      this.searchResultsSubject.next(products);
    })
  }

  getSearchQuery(): BehaviorSubject<string> {
    return this.searchQuerySubject;
  }

  getSearchResults(): Observable<Product[]> {
    return this.searchResultsSubject.asObservable();
  }

  resetSearchResults(): void {
    this.searchResultsSubject.next([]);
  }

  getProductById(productId: string): Observable<Product | null> {
      return this.http.get<Product[]>(`/assets/Sample Dataset/03.json`).pipe(
        map(response => {
          return (response[0]._id == productId ? response[0] : null)
        }),
        catchError(() => {
          return throwError(() => new Error('Failed to fetch product'));
        })
      );
    }
}

