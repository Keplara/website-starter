import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface Account {
    username: string;
    emailAddress: string;
    password: string;
}


@Injectable({providedIn: 'root'})
export class AuthorizationService {

    private readonly baseUrl: string = "http://localhost:8084";

    constructor(private http: HttpClient) { }

    public createAccount(account: Account): Observable<any> {
        const url = `${this.baseUrl}/create-account`;
        return this.http.post(url, account);
    }
}