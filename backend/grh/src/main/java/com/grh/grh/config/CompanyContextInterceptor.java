package com.grh.grh.config;

import com.grh.grh.service.KeycloakUserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CompanyContextInterceptor implements HandlerInterceptor {

    private final KeycloakUserService keycloakUserService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null || !auth.isAuthenticated()) {
            return true;
        }

        // Skip for super admin endpoints
        if (request.getRequestURI().startsWith("/api/v1/super-admin")) {
            return true;
        }

        // For normal users, validate companyId in request matches user's company
        String companyIdParam = request.getParameter("companyId");
        if (companyIdParam != null) {
            UUID requestedCompanyId = UUID.fromString(companyIdParam);
            UUID userCompanyId = keycloakUserService.getCurrentUserCompanyId(auth);
            
            // Super admin can access any company
            if (keycloakUserService.isSuperAdmin(auth)) {
                return true;
            }

            // user can access only his company
            if (!requestedCompanyId.equals(userCompanyId)) {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                return false;
            }
        }

        return true;
    }
}