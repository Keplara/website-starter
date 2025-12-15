package com.mysite.auth_service.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

  @RequestMapping(value = { "/", "/login", })
  public String forwardToIndex() {
    return "forward:/index.html";
  }

  // Catch-all for any other Angular routes (except API endpoints and static
  // files)
  @GetMapping(value = "/{path:[^\\.]*}")
  public String forwardOtherPaths() {
    return "forward:/index.html";
  }
}
